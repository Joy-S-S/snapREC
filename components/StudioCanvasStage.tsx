'use client';

import * as React from 'react';
import { StudioSettings, RecordingStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Monitor,
  Video,
  Pause,
  Play,
  Square,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudioCanvasStageProps {
  settings: StudioSettings;
  status: RecordingStatus;
  countdownNumber: number;
  elapsedSeconds: number;
  previewStream: MediaStream | null;
  camStream: MediaStream | null;
  onPositionChange: (pos: StudioSettings['camPosition']) => void;
  onPauseToggle: () => void;
  onStop: () => void;
  onStart: () => void;
}

export function StudioCanvasStage({
  settings,
  status,
  countdownNumber,
  elapsedSeconds,
  previewStream,
  camStream,
  onPositionChange,
  onPauseToggle,
  onStop,
  onStart,
}: StudioCanvasStageProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const camVideoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
      videoRef.current.play().catch(console.error);
    }
  }, [previewStream]);

  React.useEffect(() => {
    if (camVideoRef.current && camStream) {
      camVideoRef.current.srcObject = camStream;
      camVideoRef.current.play().catch(console.error);
    }
  }, [camStream]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getPositionClasses = (pos: StudioSettings['camPosition']) => {
    switch (pos) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  const getShapeClasses = (shape: StudioSettings['camShape']) => {
    switch (shape) {
      case 'circle':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-2xl';
      case 'square':
      default:
        return 'rounded-none';
    }
  };

  const getSizeClasses = (size: StudioSettings['camSize']) => {
    switch (size) {
      case 'small':
        return 'w-24 h-24 sm:w-28 sm:h-28';
      case 'large':
        return 'w-44 h-44 sm:w-52 sm:h-52';
      case 'medium':
      default:
        return 'w-32 h-32 sm:w-40 sm:h-40';
    }
  };

  const corners: StudioSettings['camPosition'][] = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ];

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-neutral-900 to-black shadow-2xl flex items-center justify-center">
      {/* 1. Live Screen Video if available */}
      {previewStream && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-contain"
        />
      )}

      {/* 2. Idle State Placeholder Stage */}
      {!previewStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none">
          {/* Ambient glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4 shadow-lg shadow-purple-500/10">
              <Monitor className="h-8 w-8 text-purple-400" />
            </div>

            <h3 className="text-xl font-bold tracking-tight text-white mb-2">
              Studio Stage Ready
            </h3>
            <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
              {settings.mode === 'screen_cam' && 'Screen + webcam will be recorded together in 1080p/4K.'}
              {settings.mode === 'screen_only' && 'Select your screen, application window, or browser tab to capture.'}
              {settings.mode === 'cam_only' && 'Your webcam will be recorded in full-frame.'}
              {settings.mode === 'audio_only' && 'Microphone and system audio will be captured into high-fidelity audio.'}
            </p>

            <Button
              size="lg"
              onClick={onStart}
              className="gap-2.5 rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-purple-500/25 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white border-0 transition-transform hover:scale-105 active:scale-95"
            >
              <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
              Start Recording
            </Button>
          </div>

          {/* Interactive corner target pins when Screen + Cam is selected */}
          {settings.mode === 'screen_cam' && (
            <div className="absolute inset-0 p-4 pointer-events-none">
              {corners.map((corner) => {
                const isActive = settings.camPosition === corner;
                return (
                  <button
                    key={corner}
                    type="button"
                    onClick={() => onPositionChange(corner)}
                    className={cn(
                      'pointer-events-auto absolute p-1.5 rounded-lg border text-[11px] font-medium transition-all',
                      isActive
                        ? 'border-purple-500 bg-purple-500/30 text-white shadow-md shadow-purple-500/30'
                        : 'border-white/10 bg-black/40 text-neutral-400 hover:text-white hover:border-white/30',
                      corner === 'top-left' && 'top-3 left-3',
                      corner === 'top-right' && 'top-3 right-3',
                      corner === 'bottom-left' && 'bottom-3 left-3',
                      corner === 'bottom-right' && 'bottom-3 right-3'
                    )}
                  >
                    {corner.replace('-', ' ')}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Camera Overlay in Screen+Cam mode */}
      {settings.mode === 'screen_cam' && (
        <div
          className={cn(
            'absolute transition-all duration-300 z-20 overflow-hidden shadow-2xl border-2 border-white/80 ring-2 ring-purple-500/50 bg-black',
            getPositionClasses(settings.camPosition),
            getShapeClasses(settings.camShape),
            getSizeClasses(settings.camSize)
          )}
        >
          {camStream ? (
            <video
              ref={camVideoRef}
              autoPlay
              muted
              playsInline
              className={cn(
                'h-full w-full object-cover',
                settings.mirrorCam && '-scale-x-100'
              )}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-tr from-purple-900/60 to-black p-2 text-center text-white/80">
              <Video className="h-6 w-6 text-purple-400 mb-1" />
              <span className="text-[10px] font-semibold tracking-wide uppercase">Webcam</span>
            </div>
          )}
        </div>
      )}

      {/* 4. Fullscreen Countdown Overlay */}
      {status === 'countdown' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex flex-col items-center">
            <span className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 animate-bounce drop-shadow-[0_0_35px_rgba(168,85,247,0.5)]">
              {countdownNumber}
            </span>
            <span className="text-sm font-semibold tracking-widest text-neutral-400 uppercase mt-2">
              Get Ready
            </span>
          </div>
        </div>
      )}

      {/* 5. In-Stage Floating Recording Bar when Recording */}
      {(status === 'recording' || status === 'paused') && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-full border border-white/15 bg-black/80 px-4 py-2 backdrop-blur-lg shadow-2xl">
          <div className="flex items-center gap-2 pr-2 border-r border-white/10">
            <div
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                status === 'recording' ? 'bg-red-500 animate-ping' : 'bg-amber-500'
              )}
            />
            <span className="font-mono text-sm font-bold text-white tracking-wider">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={onPauseToggle}
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
            title={status === 'recording' ? 'Pause Recording' : 'Resume Recording'}
          >
            {status === 'recording' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            size="icon"
            variant="destructive"
            onClick={onStop}
            className="h-8 w-8 rounded-full shadow-md shadow-red-500/30"
            title="Stop & Save Recording"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </Button>
        </div>
      )}

      {/* Top right badges */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2 pointer-events-none">
        <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-neutral-300 border border-white/10 text-xs">
          {settings.resolution === 'native' ? 'Native' : settings.resolution} &bull; {settings.frameRate} FPS
        </Badge>
        <Badge variant="secondary" className="bg-purple-950/60 backdrop-blur-md text-purple-300 border border-purple-500/30 text-xs uppercase font-semibold">
          {settings.format}
        </Badge>
      </div>
    </div>
  );
}
