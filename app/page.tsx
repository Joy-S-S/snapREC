'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  RecordingMode,
  RecordingStatus,
  StudioSettings,
  RecordingItem,
  MediaDeviceInfoSimple,
} from '@/lib/types';
import { AudioMixer } from '@/lib/audio-mixer';
import { CanvasCompositor } from '@/lib/canvas-compositor';
import { getBestMimeType, processRecordingBlob } from '@/lib/mp4-engine';
import { StudioNavbar } from '@/components/StudioNavbar';
import { StudioModeSelector } from '@/components/StudioModeSelector';
import { StudioCanvasStage } from '@/components/StudioCanvasStage';
import { ControlsHUD } from '@/components/ControlsHUD';
import { SettingsPanel } from '@/components/SettingsPanel';
import { PreviewTrimmerModal } from '@/components/PreviewTrimmerModal';
import { RecordingsLibrarySheet } from '@/components/RecordingsLibrarySheet';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';

export default function StudioPage() {
  // Studio Settings State
  const [settings, setSettings] = React.useState<StudioSettings>({
    mode: 'screen_only',
    resolution: '1920x1080',
    frameRate: 60,
    format: 'mp4',
    bitrateMbps: 8,
    micEnabled: true,
    sysAudioEnabled: true,
    micDeviceId: 'default-mic',
    camDeviceId: 'default-cam',
    micVolume: 1.0,
    sysVolume: 1.0,
    camShape: 'circle',
    camPosition: 'bottom-right',
    camSize: 'medium',
    mirrorCam: true,
    bakedCanvasCam: true,
    countdownSeconds: 3,
    projectName: 'Screen_Recording',
  });

  // Recording Engine State
  const [status, setStatus] = React.useState<RecordingStatus>('idle');
  const [countdownNumber, setCountdownNumber] = React.useState<number>(3);
  const [elapsedSeconds, setElapsedSeconds] = React.useState<number>(0);
  const [micLevel, setMicLevel] = React.useState<number>(0);
  const [sysLevel, setSysLevel] = React.useState<number>(0);

  // Hardware Devices
  const [audioDevices, setAudioDevices] = React.useState<MediaDeviceInfoSimple[]>([]);
  const [videoDevices, setVideoDevices] = React.useState<MediaDeviceInfoSimple[]>([]);

  // Active Streams & Recording Refs
  const [previewStream, setPreviewStream] = React.useState<MediaStream | null>(null);
  const [camStream, setCamStream] = React.useState<MediaStream | null>(null);

  const screenStreamRef = React.useRef<MediaStream | null>(null);
  const camStreamRef = React.useRef<MediaStream | null>(null);
  const micStreamRef = React.useRef<MediaStream | null>(null);
  const audioMixerRef = React.useRef<AudioMixer | null>(null);
  const compositorRef = React.useRef<CanvasCompositor | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);
  const startTimeRef = React.useRef<number>(0);
  const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const vuAnimRef = React.useRef<number | null>(null);
  const isNativeMp4Ref = React.useRef<boolean>(false);

  // Library & Modal States
  const [libraryItems, setLibraryItems] = React.useState<RecordingItem[]>([]);
  const [selectedItemForReview, setSelectedItemForReview] = React.useState<RecordingItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = React.useState<boolean>(false);
  const [librarySheetOpen, setLibrarySheetOpen] = React.useState<boolean>(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = React.useState<boolean>(false);

  // Enumerate Media Devices on Mount
  const enumerateDevices = React.useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, idx) => ({
          deviceId: d.deviceId || `mic-${idx + 1}`,
          label: d.label || `Microphone ${idx + 1}`,
        }));
      const cams = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, idx) => ({
          deviceId: d.deviceId || `cam-${idx + 1}`,
          label: d.label || `Camera ${idx + 1}`,
        }));

      if (mics.length === 0) {
        mics.push({ deviceId: 'default-mic', label: 'Default Microphone' });
      }
      if (cams.length === 0) {
        cams.push({ deviceId: 'default-cam', label: 'Default Camera' });
      }

      setAudioDevices(mics);
      setVideoDevices(cams);

      setSettings((prev) => ({
        ...prev,
        micDeviceId: prev.micDeviceId && prev.micDeviceId !== 'default-mic' ? prev.micDeviceId : mics[0].deviceId,
        camDeviceId: prev.camDeviceId && prev.camDeviceId !== 'default-cam' ? prev.camDeviceId : cams[0].deviceId,
      }));
    } catch (e) {
      console.warn('Device enumeration error:', e);
    }
  }, [settings.micDeviceId, settings.camDeviceId]);

  React.useEffect(() => {
    enumerateDevices();
  }, [enumerateDevices]);

  // Update Settings Helper
  const handleUpdateSettings = (partial: Partial<StudioSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      // Realtime volume updates if mixer is running
      if (partial.micVolume !== undefined && audioMixerRef.current) {
        audioMixerRef.current.setMicVolume(partial.micVolume);
      }
      if (partial.sysVolume !== undefined && audioMixerRef.current) {
        audioMixerRef.current.setSysVolume(partial.sysVolume);
      }
      // Realtime compositor updates
      if (compositorRef.current) {
        compositorRef.current.updateOptions({
          shape: updated.camShape,
          position: updated.camPosition,
          size: updated.camSize,
          mirrorCam: updated.mirrorCam,
        });
      }
      return updated;
    });
  };

  // Live VU Meter animation loop
  const startVULoop = React.useCallback(() => {
    const loop = () => {
      if (audioMixerRef.current) {
        const { micLevel: m, sysLevel: s } = audioMixerRef.current.getLevels();
        setMicLevel(m);
        setSysLevel(s);
      }
      vuAnimRef.current = requestAnimationFrame(loop);
    };
    vuAnimRef.current = requestAnimationFrame(loop);
  }, []);

  const stopVULoop = React.useCallback(() => {
    if (vuAnimRef.current !== null) {
      cancelAnimationFrame(vuAnimRef.current);
      vuAnimRef.current = null;
    }
    setMicLevel(0);
    setSysLevel(0);
  }, []);

  // Cleanup helper
  const cleanupRecordingStreams = React.useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    stopVULoop();

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (camStreamRef.current) {
      camStreamRef.current.getTracks().forEach((t) => t.stop());
      camStreamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioMixerRef.current) {
      audioMixerRef.current.close();
      audioMixerRef.current = null;
    }
    if (compositorRef.current) {
      compositorRef.current.stop();
      compositorRef.current = null;
    }

    setPreviewStream(null);
    setCamStream(null);
  }, [stopVULoop]);

  // Stop Recording
  const handleStopRecording = React.useCallback(() => {
    if (!mediaRecorderRef.current || status === 'idle' || status === 'stopped') {
      return;
    }

    setStatus('processing');
    toast.info('Finalizing and indexing recording...');

    try {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (e) {
      console.warn('Error stopping media recorder:', e);
    }
  }, [status]);

  // Pause / Resume Toggle
  const handlePauseToggle = React.useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (status === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      toast.info('Recording paused');
    } else if (status === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      toast.info('Recording resumed');
    }
  }, [status]);

  // Start Recording Pipeline
  const handleStartRecording = async () => {
    if (status !== 'idle') return;

    try {
      recordedChunksRef.current = [];

      // 1. Get Screen / Display Stream
      let screenStream: MediaStream | null = null;
      if (settings.mode !== 'cam_only' && settings.mode !== 'audio_only') {
        let widthConstraint: number | undefined = undefined;
        let heightConstraint: number | undefined = undefined;

        if (settings.resolution !== 'native') {
          const [w, h] = settings.resolution.split('x').map(Number);
          widthConstraint = w;
          heightConstraint = h;
        }

        const displayVideoConstraints: MediaTrackConstraints = {
          width: widthConstraint ? { ideal: widthConstraint } : undefined,
          height: heightConstraint ? { ideal: heightConstraint } : undefined,
          frameRate: { ideal: settings.frameRate },
        };
        // @ts-expect-error Chromium-specific cursor display surface constraint
        displayVideoConstraints.cursor = 'always';

        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: displayVideoConstraints,
          audio: settings.sysAudioEnabled,
        });

        screenStreamRef.current = screenStream;
        setPreviewStream(screenStream);

        // When user clicks browser's native "Stop sharing" button
        screenStream.getVideoTracks()[0].onended = () => {
          handleStopRecording();
        };
      }

      // 2. Get Camera Stream if enabled
      let camStream: MediaStream | null = null;
      if (settings.mode === 'screen_cam' || settings.mode === 'cam_only') {
        try {
          const isSpecificCam = settings.camDeviceId && !settings.camDeviceId.startsWith('default') && !settings.camDeviceId.startsWith('cam-');
          camStream = await navigator.mediaDevices.getUserMedia({
            video: isSpecificCam ? { deviceId: { exact: settings.camDeviceId } } : true,
          });
          camStreamRef.current = camStream;
          setCamStream(camStream);
          if (settings.mode === 'cam_only') {
            setPreviewStream(camStream);
          }
        } catch (e) {
          console.warn('Camera access denied or unavailable:', e);
          toast.error('Camera could not be accessed. Recording without camera.');
        }
      }

      // 3. Get Microphone Stream if enabled
      let micStream: MediaStream | null = null;
      if (settings.micEnabled) {
        try {
          const isSpecificMic = settings.micDeviceId && !settings.micDeviceId.startsWith('default') && !settings.micDeviceId.startsWith('mic-');
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: isSpecificMic ? { deviceId: { exact: settings.micDeviceId } } : true,
          });
          micStreamRef.current = micStream;
        } catch (e) {
          console.warn('Microphone access denied:', e);
          toast.error('Microphone access denied. Recording without mic.');
        }
      }

      // Re-enumerate devices now that permissions were granted
      enumerateDevices();

      // 4. Mix Audio Tracks
      const audioMixer = new AudioMixer();
      audioMixerRef.current = audioMixer;
      const mixedAudioTrack = await audioMixer.init({
        micStream,
        sysStream: screenStream,
        micVolume: settings.micVolume,
        sysVolume: settings.sysVolume,
      });

      // 5. Build Unified Video Track (Canvas Compositor or Direct Track)
      let finalVideoTrack: MediaStreamTrack | null = null;
      if (settings.mode === 'screen_cam' && screenStream && camStream && settings.bakedCanvasCam) {
        const [targetWidth, targetHeight] =
          settings.resolution === 'native'
            ? [screenStream.getVideoTracks()[0].getSettings().width || 1920, screenStream.getVideoTracks()[0].getSettings().height || 1080]
            : settings.resolution.split('x').map(Number);

        const compositor = new CanvasCompositor({
          width: targetWidth,
          height: targetHeight,
          frameRate: settings.frameRate,
          shape: settings.camShape,
          position: settings.camPosition,
          size: settings.camSize,
          mirrorCam: settings.mirrorCam,
        });
        compositorRef.current = compositor;
        finalVideoTrack = compositor.start(screenStream, camStream);
      } else if (screenStream) {
        finalVideoTrack = screenStream.getVideoTracks()[0];
      } else if (camStream) {
        finalVideoTrack = camStream.getVideoTracks()[0];
      }

      // Combine final tracks
      const finalTracks: MediaStreamTrack[] = [];
      if (finalVideoTrack && settings.mode !== 'audio_only') {
        finalTracks.push(finalVideoTrack);
      }
      if (mixedAudioTrack) {
        finalTracks.push(mixedAudioTrack);
      }

      if (finalTracks.length === 0) {
        throw new Error('No video or audio tracks available to record.');
      }

      const combinedStream = new MediaStream(finalTracks);

      // 6. Countdown Animation
      if (settings.countdownSeconds > 0) {
        setStatus('countdown');
        for (let i = settings.countdownSeconds; i > 0; i--) {
          setCountdownNumber(i);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      // 7. Initialize MediaRecorder with Best MIME Type
      const { mimeType, isNativeMp4 } = getBestMimeType(settings.format);
      isNativeMp4Ref.current = isNativeMp4;

      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }
      if (settings.bitrateMbps) {
        recorderOptions.videoBitsPerSecond = settings.bitrateMbps * 1000 * 1000;
      }

      const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const durationMs = Math.max(1000, Date.now() - startTimeRef.current);
        const durationSec = durationMs / 1000;

        try {
          const { blob, finalFormat } = await processRecordingBlob(
            recordedChunksRef.current,
            durationMs,
            settings.format,
            isNativeMp4Ref.current
          );

          const dateStr = new Date().toISOString().slice(0, 10);
          const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '-');
          const title = `${settings.projectName || 'Recording'}_${dateStr}_${timeStr}`;
          const url = URL.createObjectURL(blob);

          const newTake: RecordingItem = {
            id: `rec-${Date.now()}`,
            name: title,
            timestamp: Date.now(),
            duration: durationSec,
            blob,
            url,
            format: finalFormat,
            sizeBytes: blob.size,
            mode: settings.mode,
          };

          setLibraryItems((prev) => [newTake, ...prev]);
          setSelectedItemForReview(newTake);
          setReviewModalOpen(true);
          toast.success('Recording complete! Review or download your take.');
        } catch (err) {
          console.error('Error processing recording blob:', err);
          toast.error('Failed to finalize video file.');
        } finally {
          cleanupRecordingStreams();
          setStatus('idle');
          setElapsedSeconds(0);
        }
      };

      // Start recording with 250ms chunks
      mediaRecorder.start(250);
      startTimeRef.current = Date.now();
      setStatus('recording');
      setElapsedSeconds(0);
      toast.success(
        isNativeMp4 && settings.format === 'mp4'
          ? 'Recording in native hardware-accelerated MP4'
          : `Recording in ${settings.format.toUpperCase()}`
      );

      // Start timers and VU meters
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      startVULoop();
    } catch (err: unknown) {
      console.error('Failed to start recording:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('Permission denied') || message.includes('cancelled')) {
        toast.info('Recording was cancelled.');
      } else {
        toast.error(`Could not start recording: ${message}`);
      }
      cleanupRecordingStreams();
      setStatus('idle');
    }
  };

  // Keyboard Shortcuts Listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (status === 'idle') handleStartRecording();
        else handleStopRecording();
      }

      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePauseToggle();
      }

      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleStopRecording();
      }

      if (e.key === 'Escape' && status === 'countdown') {
        e.preventDefault();
        cleanupRecordingStreams();
        setStatus('idle');
        toast.info('Recording cancelled.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleStopRecording, handlePauseToggle, cleanupRecordingStreams]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-purple-500/30">
      {/* Top Navigation */}
      <StudioNavbar
        status={status}
        elapsedSeconds={elapsedSeconds}
        libraryCount={libraryItems.length}
        onOpenLibrary={() => setLibrarySheetOpen(true)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
      />

      {/* Main Studio Area */}
      <main className="flex-1 container max-w-7xl px-4 sm:px-8 py-6 space-y-6">
        {/* Recording Mode Selector */}
        <StudioModeSelector
          mode={settings.mode}
          disabled={status !== 'idle'}
          onChange={(newMode) => handleUpdateSettings({ mode: newMode })}
        />

        {/* Video Canvas Stage */}
        <StudioCanvasStage
          settings={settings}
          status={status}
          countdownNumber={countdownNumber}
          elapsedSeconds={elapsedSeconds}
          previewStream={previewStream}
          camStream={camStream}
          onPositionChange={(pos) => handleUpdateSettings({ camPosition: pos })}
          onPauseToggle={handlePauseToggle}
          onStop={handleStopRecording}
          onStart={handleStartRecording}
        />

        {/* Core Controls HUD */}
        <ControlsHUD
          status={status}
          settings={settings}
          elapsedSeconds={elapsedSeconds}
          micLevel={micLevel}
          sysLevel={sysLevel}
          onStart={handleStartRecording}
          onPauseToggle={handlePauseToggle}
          onStop={handleStopRecording}
        />

        {/* Studio Settings Panel */}
        <SettingsPanel
          settings={settings}
          audioDevices={audioDevices}
          videoDevices={videoDevices}
          disabled={status !== 'idle'}
          onUpdate={handleUpdateSettings}
        />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>
          snapREC Studio &bull; 100% Client-Side &bull; Genuine MP4 &bull; Built for GitHub Pages
        </p>
      </footer>

      {/* Post-Recording Trimmer & Review Modal */}
      <PreviewTrimmerModal
        item={selectedItemForReview}
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onDiscard={(id) => {
          setLibraryItems((prev) => prev.filter((i) => i.id !== id));
          toast.info('Recording discarded.');
        }}
        onSaveToLibrary={(updatedItem) => {
          setLibraryItems((prev) =>
            prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
          );
          toast.success('Saved to Session Takes.');
        }}
      />

      {/* Session Takes Library Sheet */}
      <RecordingsLibrarySheet
        open={librarySheetOpen}
        onOpenChange={setLibrarySheetOpen}
        items={libraryItems}
        onSelect={(item) => {
          setSelectedItemForReview(item);
          setReviewModalOpen(true);
        }}
        onDelete={(id) => {
          setLibraryItems((prev) => prev.filter((i) => i.id !== id));
          toast.info('Take removed.');
        }}
        onClearAll={() => {
          setLibraryItems([]);
          toast.info('Cleared all takes.');
        }}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsModalOpen}
        onOpenChange={setShortcutsModalOpen}
      />
    </div>
  );
}
