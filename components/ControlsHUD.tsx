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
    <Card className="p-3 sm:p-4 border-border/80 shadow-sm bg-card">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Timer & Audio VU Meters */}
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
          {/* Digital Timer */}
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block">
              Duration
            </span>
            <div className="font-mono text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {formatTimer(elapsedSeconds)}
            </div>
          </div>

          {/* Audio VU Meters */}
          <div className="flex flex-col gap-1.5 min-w-[120px] sm:min-w-[160px] lg:min-w-[180px]">
            {/* Mic Meter */}
            <div className="flex items-center gap-1.5">
              <Mic
                className={cn(
                  'h-3 w-3 shrink-0 transition-colors',
                  settings.micEnabled ? 'text-indigo-600' : 'text-muted-foreground opacity-30'
                )}
              />
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75 rounded-full"
                  style={{ width: settings.micEnabled ? `${micLevel}%` : '0%' }}
                />
              </div>
            </div>

            {/* System Audio Meter */}
            <div className="flex items-center gap-1.5">
              <Volume2
                className={cn(
                  'h-3 w-3 shrink-0 transition-colors',
                  settings.sysAudioEnabled ? 'text-sky-500' : 'text-muted-foreground opacity-30'
                )}
              />
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75 rounded-full"
                  style={{ width: settings.sysAudioEnabled ? `${sysLevel}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end">
          {!isActive ? (
            <Button
              size="default"
              onClick={onStart}
              className="gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold tracking-wide shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white border-0 transition-all hover:scale-105 active:scale-95"
            >
              <Circle className="h-2.5 w-2.5 fill-current animate-ping" />
              <span>Record Screen</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant={isPaused ? 'default' : 'secondary'}
                size="sm"
                onClick={onPauseToggle}
                className="gap-1.5 rounded-full px-4 h-9 font-semibold text-xs border"
              >
                {isPaused ? (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current text-emerald-500" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5 text-amber-500" />
                    <span>Pause</span>
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={onStop}
                className="gap-1.5 rounded-full px-4 h-9 font-bold text-xs shadow-md shadow-red-500/25"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Stop & Review</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
