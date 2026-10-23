'use client';

import * as React from 'react';
import { RecordingMode } from '@/lib/types';
import { Monitor, Camera, Mic, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudioModeSelectorProps {
  mode: RecordingMode;
  onChange: (mode: RecordingMode) => void;
  disabled?: boolean;
}

const MODES: { id: RecordingMode; label: string; icon: React.ElementType }[] = [
  {
    id: 'screen_only',
    label: 'Screen Only',
    icon: Monitor,
  },
  {
    id: 'screen_cam',
    label: 'Screen + Cam',
    icon: Video,
  },
  {
    id: 'cam_only',
    label: 'Camera Only',
    icon: Camera,
  },
  {
    id: 'audio_only',
    label: 'Audio Only',
    icon: Mic,
  },
];

export function StudioModeSelector({ mode, onChange, disabled }: StudioModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
      {MODES.map((item) => {
        const Icon = item.icon;
        const isSelected = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              'group relative flex items-center justify-center gap-2 p-2 sm:p-2.5 rounded-xl border text-center transition-all duration-200 outline-none',
              'disabled:opacity-50 disabled:pointer-events-none',
              isSelected
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-sm dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-500'
                : 'border-border/80 bg-card text-muted-foreground hover:border-slate-300 hover:bg-muted/50 dark:hover:border-slate-700'
            )}
          >
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-lg transition-colors shrink-0',
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-muted text-muted-foreground group-hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-medium leading-tight truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
