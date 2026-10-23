'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecordingStatus } from '@/lib/types';
import {
  Video,
  Sun,
  Moon,
  Keyboard,
  Film,
  Circle,
  ExternalLink,
} from 'lucide-react';

interface StudioNavbarProps {
  status: RecordingStatus;
  elapsedSeconds: number;
  libraryCount: number;
  onOpenLibrary: () => void;
  onOpenShortcuts: () => void;
}

export function StudioNavbar({
  status,
  elapsedSeconds,
  libraryCount,
  onOpenLibrary,
  onOpenShortcuts,
}: StudioNavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-[1600px] mx-auto flex h-14 items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-indigo-600 shadow-sm shadow-indigo-600/20">
            <Video className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-foreground">
                snap<span className="text-indigo-600 font-extrabold">REC</span>
              </span>
              <Badge variant="outline" className="hidden sm:inline-flex text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0 border-slate-200 dark:border-slate-800">
                Studio 2.0
              </Badge>
            </div>
          </div>
        </div>

        {/* Center Status & Timer */}
        <div className="flex items-center gap-2">
          {status === 'recording' && (
            <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1 text-sm font-medium text-red-500 animate-pulse">
              <Circle className="h-2.5 w-2.5 fill-red-500" />
              <span>REC</span>
              <span className="font-mono font-semibold">{formatTimer(elapsedSeconds)}</span>
            </div>
          )}

          {status === 'paused' && (
            <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-sm font-medium text-amber-500">
              <Circle className="h-2.5 w-2.5 fill-amber-500" />
              <span>PAUSED</span>
              <span className="font-mono font-semibold">{formatTimer(elapsedSeconds)}</span>
            </div>
          )}

          {status === 'idle' && (
            <div className="hidden md:flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs text-muted-foreground">
              <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
              <span>Studio Ready</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Keyboard Shortcuts */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Keyboard className="h-4 w-4" />
          </Button>

          {/* Takes Library */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenLibrary}
            className="relative gap-1.5 h-9"
          >
            <Film className="h-4 w-4" />
            <span className="hidden sm:inline">Takes</span>
            {libraryCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[11px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                {libraryCount}
              </Badge>
            )}
          </Button>

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}

          {/* GitHub link */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-9 w-9 text-muted-foreground hover:text-foreground hidden sm:flex"
            title="GitHub Repository"
          >
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
