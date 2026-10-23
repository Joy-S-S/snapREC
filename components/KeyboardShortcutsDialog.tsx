'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  { keys: ['Alt', 'R'], action: 'Start or Stop Recording' },
  { keys: ['Alt', 'P'], action: 'Pause or Resume Recording' },
  { keys: ['Alt', 'S'], action: 'Stop & Open Review Trimmer' },
  { keys: ['Esc'], action: 'Cancel Countdown or Close Modals' },
];

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Keyboard className="h-5 w-5 text-indigo-600" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Quickly control recordings with keyboard shortcuts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 pt-2">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/40 text-xs"
            >
              <span className="text-foreground font-medium">{item.action}</span>
              <div className="flex items-center gap-1">
                {item.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="rounded bg-background px-2 py-0.5 border font-mono text-[11px] font-bold shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
