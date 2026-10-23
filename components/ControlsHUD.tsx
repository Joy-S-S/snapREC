'use client';

import * as React from 'react';
import { RecordingStatus, StudioSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Circle,
  Pause,
  Play,
  Square,
  Mic,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlsHUDProps {
  status: RecordingStatus;
  settings: StudioSettings;
  elapsedSeconds: number;
  micLevel: number; // 0 to 100
  sysLevel: number; // 0 to 100
  onStart: () => void;
  onPauseToggle: () => void;
  onStop: () => void;
}

export function ControlsHUD({
  status,
  settings,
  elapsedSeconds,
  micLevel,
  sysLevel,
  onStart,
  onPauseToggle,
  onStop,
}: ControlsHUDProps) {
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  const isRecording = status === 'recording';
  const isPaused = status === 'paused';
  const isActive = isRecording || isPaused;

  return (
    <Card className="p-4 sm:p-5 border-border/70 shadow-lg bg-card/90 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Timer & Audio VU Meters */}
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
          {/* Digital Timer */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-0.5">
              Duration
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {formatTimer(elapsedSeconds)}
            </div>
          </div>

          {/* Audio VU Meters */}
          <div className="flex flex-col gap-2 min-w-[130px] sm:min-w-[150px]">
            {/* Mic Meter */}
            <div className="flex items-center gap-2">
              <Mic
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-colors',
                  settings.micEnabled ? 'text-purple-500' : 'text-muted-foreground opacity-40'
                )}
              />
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75 rounded-full"
                  style={{ width: settings.micEnabled ? `${micLevel}%` : '0%' }}
                />
              </div>
            </div>

            {/* System Audio Meter */}
            <div className="flex items-center gap-2">
              <Volume2
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-colors',
                  settings.sysAudioEnabled ? 'text-sky-500' : 'text-muted-foreground opacity-40'
                )}
              />
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75 rounded-full"
                  style={{ width: settings.sysAudioEnabled ? `${sysLevel}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right: Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
          {!isActive ? (
            <Button
              size="lg"
              onClick={onStart}
              className="gap-2.5 rounded-full px-7 py-6 text-sm font-bold tracking-wide shadow-lg shadow-purple-500/25 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:from-purple-500 hover:to-pink-500 text-white border-0 transition-transform hover:scale-105 active:scale-95"
            >
              <Circle className="h-3 w-3 fill-current animate-ping" />
              <span>Record Screen</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2.5">
              <Button
                variant={isPaused ? 'default' : 'secondary'}
                size="lg"
                onClick={onPauseToggle}
                className="gap-2 rounded-full px-5 py-6 h-auto font-semibold border"
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 fill-current text-emerald-500" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 text-amber-500" />
                    <span>Pause</span>
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={onStop}
                className="gap-2 rounded-full px-6 py-6 h-auto font-bold shadow-lg shadow-red-500/25"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Stop & Review</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
