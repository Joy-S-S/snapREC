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
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-md shadow-purple-500/25">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">
                snap<span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">REC</span>
              </span>
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0">
                Studio 2.0
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Client-Side Screen Studio &bull; Real MP4 Export
            </p>
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
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1 text-[11px] bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold">
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
