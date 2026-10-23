'use client';

import * as React from 'react';
import { RecordingItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import * as SliderPrimitive from '@radix-ui/react-slider';
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
  Play,
  Pause,
  RotateCcw,
  Sparkles,
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
  const [trimRange, setTrimRange] = React.useState<[number, number]>([0, 100]);
  const [isPlayingTrim, setIsPlayingTrim] = React.useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = React.useState(false);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setTrimRange([0, 100]);
      setDuration(item.duration || 1);
      setIsPlayingTrim(false);
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
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  const startTimeSec = (trimRange[0] / 100) * duration;
  const endTimeSec = (trimRange[1] / 100) * duration;
  const exportDurationSec = Math.max(0, endTimeSec - startTimeSec);
  const isTrimmed = trimRange[0] > 0 || trimRange[1] < 100;

  // Single timeline dual-thumb handler
  const handleRangeChange = (newRange: number[]) => {
    if (newRange.length === 2) {
      const [start, end] = newRange;
      setTrimRange([start, end]);

      if (videoRef.current) {
        // If start moved, seek to start; if end moved, seek to end
        if (start !== trimRange[0]) {
          videoRef.current.currentTime = (start / 100) * duration;
        } else if (end !== trimRange[1]) {
          videoRef.current.currentTime = (end / 100) * duration;
        }
      }
    }
  };

  // Play only the trimmed region
  const togglePlayTrimmed = () => {
    if (!videoRef.current) return;

    if (isPlayingTrim) {
      videoRef.current.pause();
      setIsPlayingTrim(false);
    } else {
      videoRef.current.currentTime = startTimeSec;
      videoRef.current.play();
      setIsPlayingTrim(true);

      const checkTime = () => {
        if (!videoRef.current) return;
        if (videoRef.current.currentTime >= endTimeSec || videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlayingTrim(false);
        } else {
          requestAnimationFrame(checkTime);
        }
      };
      requestAnimationFrame(checkTime);
    }
  };

  const handleResetTrim = () => {
    setTrimRange([0, 100]);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
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
        <DialogContent className="max-w-3xl w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto flex flex-col gap-4">
          {/* Header */}
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <FileVideo className="h-5 w-5 text-purple-500" />
              <span>Review & Export Recording</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Preview your recording, trim unwanted parts from the beginning and end, and export in genuine MP4.
            </DialogDescription>
          </DialogHeader>

          {/* 1. Video Player Container - strictly above the trimmer */}
          <div className="relative w-full rounded-xl overflow-hidden bg-black border border-border shadow-inner max-h-[44vh] flex items-center justify-center">
            <video
              ref={videoRef}
              src={item.url}
              controls
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              className="w-full max-h-[44vh] object-contain"
            />
          </div>

          {/* 2. Unified Timeline Trimmer - strictly below the video */}
          <div className="rounded-xl border bg-card/60 p-4 space-y-3 shadow-sm">
            {/* Trimmer Title & Status Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <Scissors className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-bold text-foreground">Video Trimmer</span>
                {isTrimmed && (
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px] py-0 px-2">
                    Trim Active
                  </Badge>
                )}
              </div>

              {/* Trim duration readout */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Export Clip:</span>
                <span className="font-mono font-bold text-purple-500">
                  {formatTime(exportDurationSec)}
                </span>
                <span className="text-muted-foreground/60 text-[11px]">
                  (of {formatTime(duration)})
                </span>
              </div>
            </div>

            {/* Single Timeline Track with Dual Handles */}
            <div className="px-2 pt-2 pb-1">
              <SliderPrimitive.Root
                value={trimRange}
                min={0}
                max={100}
                step={0.1}
                minStepsBetweenThumbs={1}
                onValueChange={handleRangeChange}
                className="relative flex w-full touch-none select-none items-center py-2"
              >
                {/* Background track (dimmed out) */}
                <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-muted/80 border border-border">
                  {/* Active highlighted region between thumbs */}
                  <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-full shadow-inner" />
                </SliderPrimitive.Track>

                {/* Left Thumb: START CUT */}
                <SliderPrimitive.Thumb
                  className="block h-7 w-7 rounded-full border-2 border-purple-500 bg-background shadow-lg shadow-purple-500/40 transition-transform hover:scale-110 focus:outline-none cursor-grab active:cursor-grabbing flex items-center justify-center ring-2 ring-purple-500/20"
                  aria-label="Start Trim"
                >
                  <div className="h-2.5 w-0.5 bg-purple-500 rounded-full" />
                </SliderPrimitive.Thumb>

                {/* Right Thumb: END CUT */}
                <SliderPrimitive.Thumb
                  className="block h-7 w-7 rounded-full border-2 border-pink-500 bg-background shadow-lg shadow-pink-500/40 transition-transform hover:scale-110 focus:outline-none cursor-grab active:cursor-grabbing flex items-center justify-center ring-2 ring-pink-500/20"
                  aria-label="End Trim"
                >
                  <div className="h-2.5 w-0.5 bg-pink-500 rounded-full" />
                </SliderPrimitive.Thumb>
              </SliderPrimitive.Root>
            </div>

            {/* Handle Labels & Quick Actions */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
              {/* Start handle time */}
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-muted-foreground text-[11px]">Start:</span>
                <span className="font-mono font-semibold text-foreground text-xs">
                  {formatTime(startTimeSec)}
                </span>
              </div>

              {/* Center controls: Preview & Reset */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayTrimmed}
                  className="h-7 px-2.5 text-xs gap-1.5 font-medium"
                >
                  {isPlayingTrim ? (
                    <>
                      <Pause className="h-3 w-3 text-amber-500" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 fill-current text-purple-500" />
                      <span>Play Cut</span>
                    </>
                  )}
                </Button>

                {isTrimmed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetTrim}
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    title="Reset to full length"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>

              {/* End handle time */}
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                <span className="text-muted-foreground text-[11px]">End:</span>
                <span className="font-mono font-semibold text-foreground text-xs">
                  {formatTime(endTimeSec)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Metadata & File Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Recording Title</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
                placeholder="My recording title"
              />
            </div>

            <div className="flex items-center justify-start sm:justify-end gap-3 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                <Clock className="h-3.5 w-3.5 text-purple-400" />
                <span>{formatTime(duration)}</span>
              </div>
              <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                <HardDrive className="h-3.5 w-3.5 text-sky-400" />
                <span>{formatFileSize(item.sizeBytes)}</span>
              </div>
              <div className="rounded-md bg-purple-500/10 px-2 py-1 text-purple-400 font-bold uppercase text-[10px]">
                {item.format}
              </div>
            </div>
          </div>

          {/* 4. Action Footer */}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between pt-3 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDiscardOpen(true)}
              className="gap-1.5 h-9"
            >
              <Trash2 className="h-4 w-4" />
              <span>Discard Take</span>
            </Button>

            <div className="flex flex-wrap items-center gap-2 justify-end">
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
                className="gap-1.5 h-9 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-md shadow-purple-500/25"
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
