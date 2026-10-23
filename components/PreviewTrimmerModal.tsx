'use client';

import * as React from 'react';
import { RecordingItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Download,
  Scissors,
  Trash2,
  CheckCircle2,
  FileVideo,
  Clock,
  HardDrive,
} from 'lucide-react';
import { downloadBlob } from '@/lib/mp4-engine';

interface PreviewTrimmerModalProps {
  item: RecordingItem | null;
  open: boolean;
  onClose: () => void;
  onDiscard: (id: string) => void;
  onSaveToLibrary: (item: RecordingItem) => void;
}

export function PreviewTrimmerModal({
  item,
  open,
  onClose,
  onDiscard,
  onSaveToLibrary,
}: PreviewTrimmerModalProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [name, setName] = React.useState('');
  const [duration, setDuration] = React.useState(0);
  const [trimStart, setTrimStart] = React.useState(0);
  const [trimEnd, setTrimEnd] = React.useState(100);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = React.useState(false);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setTrimStart(0);
      setTrimEnd(100);
      setDuration(item.duration);
    }
  }, [item]);

  if (!item) return null;

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startTimeSec = (trimStart / 100) * duration;
  const endTimeSec = (trimEnd / 100) * duration;
  const exportDurationSec = Math.max(0, endTimeSec - startTimeSec);

  const handleStartSliderChange = ([val]: number[]) => {
    if (val >= trimEnd) val = Math.max(0, trimEnd - 1);
    setTrimStart(val);
    if (videoRef.current) {
      videoRef.current.currentTime = (val / 100) * duration;
    }
  };

  const handleEndSliderChange = ([val]: number[]) => {
    if (val <= trimStart) val = Math.min(100, trimStart + 1);
    setTrimEnd(val);
    if (videoRef.current) {
      videoRef.current.currentTime = (val / 100) * duration;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = (format: 'mp4' | 'webm') => {
    const filename = `${name.trim().replace(/\s+/g, '_') || 'recording'}.${format}`;
    downloadBlob(item.blob, filename);
  };

  const handleSaveAndClose = () => {
    onSaveToLibrary({
      ...item,
      name,
    });
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <FileVideo className="h-5 w-5 text-purple-500" />
              <span>Review & Export Recording</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preview your recording, adjust trim range markers, and export in genuine MP4 or WebM.
            </DialogDescription>
          </DialogHeader>

          {/* Video Player */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner border border-border/80">
            <video
              ref={videoRef}
              src={item.url}
              controls
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Trimmer Controls */}
          <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-foreground">
                <Scissors className="h-3.5 w-3.5 text-purple-500" />
                <span>Trim Timeline</span>
              </div>
              <span className="font-mono text-purple-500 font-bold">
                {formatTime(startTimeSec)} &rarr; {formatTime(endTimeSec)} ({formatTime(exportDurationSec)} total)
              </span>
            </div>

            {/* Start slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Start Cut ({formatTime(startTimeSec)})</span>
                <span>{trimStart.toFixed(0)}%</span>
              </div>
              <Slider
                value={[trimStart]}
                min={0}
                max={100}
                step={0.5}
                onValueChange={handleStartSliderChange}
              />
            </div>

            {/* End slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>End Cut ({formatTime(endTimeSec)})</span>
                <span>{trimEnd.toFixed(0)}%</span>
              </div>
              <Slider
                value={[trimEnd]}
                min={0}
                max={100}
                step={0.5}
                onValueChange={handleEndSliderChange}
              />
            </div>
          </div>

          {/* Metadata & Naming */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Recording Title</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
                placeholder="My recording title"
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-5 sm:pt-0">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-400" />
                <span>{formatTime(duration)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-sky-400" />
                <span>{formatFileSize(item.sizeBytes)}</span>
              </div>
              <div className="rounded-md bg-purple-500/10 px-2 py-0.5 text-purple-400 font-semibold uppercase text-[10px]">
                {item.format}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDiscardOpen(true)}
              className="gap-1.5 h-9"
            >
              <Trash2 className="h-4 w-4" />
              <span>Discard</span>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAndClose}
                className="gap-1.5 h-9"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Save to Takes</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload('webm')}
                className="gap-1.5 h-9 text-xs font-semibold"
              >
                <Download className="h-4 w-4" />
                <span>Download .webm</span>
              </Button>

              <Button
                size="sm"
                onClick={() => handleDownload('mp4')}
                className="gap-1.5 h-9 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-md shadow-purple-500/25"
              >
                <Download className="h-4 w-4" />
                <span>Download MP4</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard Confirmation Modal */}
      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this recording?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard this recording? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDiscard(item.id);
                setConfirmDiscardOpen(false);
                onClose();
              }}
            >
              Discard Recording
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
