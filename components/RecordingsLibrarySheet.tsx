'use client';

import * as React from 'react';
import { RecordingItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Film,
  Download,
  Trash2,
  Play,
  Clock,
  HardDrive,
  FileVideo,
} from 'lucide-react';
import { downloadBlob } from '@/lib/mp4-engine';

interface RecordingsLibrarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: RecordingItem[];
  onSelect: (item: RecordingItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function RecordingsLibrarySheet({
  open,
  onOpenChange,
  items,
  onSelect,
  onDelete,
  onClearAll,
}: RecordingsLibrarySheetProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-5 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-purple-500" />
              <SheetTitle className="text-base font-bold">Session Takes</SheetTitle>
              <Badge variant="secondary" className="text-xs">
                {items.length}
              </Badge>
            </div>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-8 text-xs text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </div>
          <SheetDescription className="text-xs">
            Review and download recordings from this active session.
          </SheetDescription>
        </SheetHeader>

        {/* Takes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <FileVideo className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">No recordings yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
                Hit record in the studio to capture your first take.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border bg-card p-3.5 shadow-sm transition-all hover:border-purple-500/50 hover:shadow-md flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate text-foreground">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-purple-400" />
                        {formatTime(item.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3 text-sky-400" />
                        {formatFileSize(item.sizeBytes)}
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 font-bold">
                        {item.format}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    title="Delete Take"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onSelect(item);
                      onOpenChange(false);
                    }}
                    className="flex-1 h-8 text-xs gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Review & Trim</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => downloadBlob(item.blob, `${item.name}.${item.format}`)}
                    className="h-8 px-3 text-xs gap-1.5 bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
