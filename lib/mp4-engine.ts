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
