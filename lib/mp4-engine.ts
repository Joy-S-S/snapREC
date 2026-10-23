// fix-webm-duration for WebM seekability fix
import fixWebmDuration from 'fix-webm-duration';

export function getBestMimeType(preferredFormat: 'mp4' | 'webm'): {
  mimeType: string;
  isNativeMp4: boolean;
} {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return { mimeType: '', isNativeMp4: false };
  }

  if (preferredFormat === 'mp4') {
    const mp4Types = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4;codecs=h264,aac',
      'video/mp4',
    ];

    for (const type of mp4Types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return { mimeType: type, isNativeMp4: true };
      }
    }
  }

  // Fallbacks for WebM
  const webmTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
  ];

  for (const type of webmTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return { mimeType: type, isNativeMp4: false };
    }
  }

  return { mimeType: '', isNativeMp4: false };
}

export function isNativeMp4Supported(): boolean {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return false;
  return (
    MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2') ||
    MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ||
    MediaRecorder.isTypeSupported('video/mp4')
  );
}

export async function processRecordingBlob(
  chunks: Blob[],
  durationMs: number,
  format: 'mp4' | 'webm',
  isNativeMp4: boolean
): Promise<{ blob: Blob; finalFormat: 'mp4' | 'webm' }> {
  if (isNativeMp4 && format === 'mp4') {
    // Already native genuine MP4
    const blob = new Blob(chunks, { type: 'video/mp4' });
    return { blob, finalFormat: 'mp4' };
  }

  // It's a WebM stream
  const rawWebmBlob = new Blob(chunks, { type: 'video/webm' });

  // Fix WebM duration and seekability so timeline and players work properly
  try {
    if (typeof fixWebmDuration === 'function') {
      const fixedBlob = await new Promise<Blob>((resolve) => {
        fixWebmDuration(rawWebmBlob, durationMs, (fixed: Blob) => {
          resolve(fixed);
        });
      });
      return { blob: fixedBlob, finalFormat: 'webm' };
    }
  } catch (err) {
    console.warn('fixWebmDuration failed:', err);
  }

  return { blob: rawWebmBlob, finalFormat: 'webm' };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export async function trimVideoClientSide(
  videoBlob: Blob,
  startTimeSec: number,
  endTimeSec: number,
  format: 'mp4' | 'webm',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(videoBlob);
    video.src = objectUrl;
    video.muted = false;
    video.volume = 1;
    video.playsInline = true;
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '2px';
    video.style.height = '2px';
    video.style.opacity = '0.001';
    video.style.pointerEvents = 'none';
    document.body.appendChild(video);

    // AudioContext route to avoid blasting user speakers during trim
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    let audioCtx: AudioContext | null = null;
    let audioDest: MediaStreamAudioDestinationNode | null = null;
    try {
      audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaElementSource(video);
      audioDest = audioCtx.createMediaStreamDestination();
      source.connect(audioDest);
    } catch (e) {
      console.warn('Audio routing for trimmer warning:', e);
    }

    video.onloadedmetadata = () => {
      video.currentTime = Math.max(0, startTimeSec);
    };

    video.onseeked = () => {
      try {
        const videoWithCapture = video as unknown as {
          captureStream?: () => MediaStream;
          mozCaptureStream?: () => MediaStream;
        };
        const stream =
          typeof videoWithCapture.captureStream === 'function'
            ? videoWithCapture.captureStream()
            : videoWithCapture.mozCaptureStream?.();

        if (!stream) {
          throw new Error('captureStream is not supported in this browser');
        }

        const tracks: MediaStreamTrack[] = [...stream.getVideoTracks()];
        if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
          tracks.push(audioDest.stream.getAudioTracks()[0]);
        } else if (stream.getAudioTracks().length > 0) {
          tracks.push(stream.getAudioTracks()[0]);
        }

        const combined = new MediaStream(tracks);
        const { mimeType, isNativeMp4 } = getBestMimeType(format);
        const recorder = new MediaRecorder(combined, mimeType ? { mimeType } : {});
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        const targetDurationSec = Math.max(0.1, endTimeSec - startTimeSec);
        const durationMs = targetDurationSec * 1000;

        let finished = false;
        const cleanup = () => {
          if (finished) return;
          finished = true;
          video.pause();
          if (video.parentNode) video.parentNode.removeChild(video);
          URL.revokeObjectURL(objectUrl);
          if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
        };

        recorder.onstop = async () => {
          cleanup();
          try {
            const { blob } = await processRecordingBlob(chunks, durationMs, format, isNativeMp4);
            resolve(blob);
          } catch (err) {
            reject(err);
          }
        };

        video.playbackRate = 2.0;

        const checkTimer = setInterval(() => {
          if (!video.paused && !video.ended) {
            const progress = Math.min(
              99,
              Math.round(((video.currentTime - startTimeSec) / targetDurationSec) * 100)
            );
            if (onProgress) onProgress(progress);
          }

          if (video.currentTime >= endTimeSec || video.ended) {
            clearInterval(checkTimer);
            if (onProgress) onProgress(100);
            video.pause();
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
          }
        }, 50);

        recorder.start(100);
        video.play().catch((err) => {
          clearInterval(checkTimer);
          cleanup();
          reject(err);
        });
      } catch (err) {
        video.pause();
        if (video.parentNode) video.parentNode.removeChild(video);
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      video.pause();
      if (video.parentNode) video.parentNode.removeChild(video);
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video for trimming'));
    };
  });
}
