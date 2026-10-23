'use client';

import * as React from 'react';
import { StudioSettings, RecordingStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Monitor,
  Video,
  Pause,
  Play,
  Square,
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
        return 'top-3 left-3';
      case 'top-right':
        return 'top-3 right-3';
      case 'bottom-left':
        return 'bottom-3 left-3';
      case 'bottom-right':
      default:
        return 'bottom-3 right-3';
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
        return 'w-20 h-20 sm:w-24 sm:h-24';
      case 'large':
        return 'w-36 h-36 sm:w-44 sm:h-44';
      case 'medium':
      default:
        return 'w-28 h-28 sm:w-34 sm:h-34';
    }
  };

  const corners: StudioSettings['camPosition'][] = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ];

  return (
    <div className="relative aspect-video w-full max-h-[56vh] sm:max-h-[52vh] lg:max-h-[58vh] overflow-hidden rounded-2xl border border-border/80 bg-slate-950 shadow-md flex items-center justify-center">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
          {/* Ambient glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-sm">
            <div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-2 sm:mb-3 shadow-sm">
              <Monitor className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
            </div>

            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white mb-1">
              Ready to record
            </h3>
            <p className="text-xs text-neutral-400 mb-3 sm:mb-4 leading-relaxed line-clamp-2">
              {settings.mode === 'screen_cam' && 'Capture screen and webcam together.'}
              {settings.mode === 'screen_only' && 'Select a window, screen, or tab to capture.'}
              {settings.mode === 'cam_only' && 'Capture full-frame webcam video.'}
              {settings.mode === 'audio_only' && 'Record microphone and system audio.'}
            </p>

            <Button
              size="default"
              onClick={onStart}
              className="gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white border-0 transition-all hover:scale-105 active:scale-95"
            >
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Start Recording
            </Button>
          </div>
        </div>
      )}

      {/* 3. Interactive corner target pins when Screen + Cam is selected */}
      {settings.mode === 'screen_cam' && status !== 'countdown' && (
        <div className="absolute inset-0 p-3 pointer-events-none z-30">
          {corners.map((corner) => {
            if (settings.camPosition === corner) return null;
            return (
              <button
                key={corner}
                type="button"
                onClick={() => onPositionChange(corner)}
                className={cn(
                  'pointer-events-auto absolute px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all duration-200 capitalize backdrop-blur-md shadow-md select-none',
                  'border-white/20 bg-black/60 text-neutral-200 hover:text-white hover:border-indigo-400 hover:bg-slate-900/80 active:scale-95',
                  corner === 'top-left' && 'top-3 left-3',
                  corner === 'top-right' && 'top-3 right-3',
                  corner === 'bottom-left' && 'bottom-3 left-3',
                  corner === 'bottom-right' && 'bottom-3 right-3'
                )}
                title={`Move camera to ${corner.replace('-', ' ')}`}
              >
                {corner.replace('-', ' ')}
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Camera Overlay in Screen+Cam mode */}
      {settings.mode === 'screen_cam' && (
        <div
          className={cn(
            'absolute transition-all duration-300 z-20 overflow-hidden shadow-xl border-2 border-white ring-2 ring-indigo-500 bg-black',
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
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 p-2 text-center text-white/80">
              <Video className="h-5 w-5 text-indigo-400 mb-0.5" />
              <span className="text-[9px] font-semibold tracking-wide uppercase text-slate-300">Webcam</span>
            </div>
          )}
        </div>
      )}

      {/* 5. Fullscreen Countdown Overlay */}
      {status === 'countdown' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex flex-col items-center">
            <span className="text-7xl sm:text-8xl font-black text-white animate-bounce drop-shadow-lg">
              {countdownNumber}
            </span>
            <span className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mt-2">
              Get Ready
            </span>
          </div>
        </div>
      )}

      {/* 6. In-Stage Floating Recording Bar when Recording */}
      {(status === 'recording' || status === 'paused') && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 rounded-full border border-white/15 bg-black/80 px-3.5 py-1.5 backdrop-blur-lg shadow-xl">
          <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                status === 'recording' ? 'bg-red-500 animate-ping' : 'bg-amber-500'
              )}
            />
            <span className="font-mono text-xs font-bold text-white tracking-wider">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={onPauseToggle}
            className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
            title={status === 'recording' ? 'Pause Recording' : 'Resume Recording'}
          >
            {status === 'recording' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>

          <Button
            size="icon"
            variant="destructive"
            onClick={onStop}
            className="h-7 w-7 rounded-full shadow-sm shadow-red-500/30"
            title="Stop & Save Recording"
          >
            <Square className="h-3 w-3 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );
}
