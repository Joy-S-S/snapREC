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

const MODES: { id: RecordingMode; label: string; desc: string; icon: React.ElementType }[] = [
  {
    id: 'screen_cam',
    label: 'Screen + Cam',
    desc: 'Record screen with customized webcam overlay',
    icon: Video,
  },
  {
    id: 'screen_only',
    label: 'Screen Only',
    desc: 'Capture entire display, application window, or browser tab',
    icon: Monitor,
  },
  {
    id: 'cam_only',
    label: 'Camera Only',
    desc: 'Full-frame webcam video recording',
    icon: Camera,
  },
  {
    id: 'audio_only',
    label: 'Audio Only',
    desc: 'Microphone & system audio voice recorder',
    icon: Mic,
  },
];

export function StudioModeSelector({ mode, onChange, disabled }: StudioModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
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
              'group relative flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-200 outline-none',
              'hover:border-purple-500/50 hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none',
              isSelected
                ? 'border-purple-500 bg-purple-500/10 shadow-sm shadow-purple-500/20 text-foreground font-semibold'
                : 'border-border/60 bg-card text-muted-foreground'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg mb-2 transition-colors',
                isSelected
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                  : 'bg-muted text-muted-foreground group-hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium leading-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
