export type RecordingMode = 'screen_cam' | 'screen_only' | 'cam_only' | 'audio_only';

export type ResolutionPreset = 'native' | '3840x2160' | '2560x1440' | '1920x1080' | '1280x720';

export type FrameRatePreset = 60 | 30 | 24;

export type OutputFormat = 'mp4' | 'webm';

export type CameraShape = 'circle' | 'rounded' | 'square';

export type CameraPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export type CameraSize = 'small' | 'medium' | 'large';

export type RecordingStatus = 'idle' | 'countdown' | 'recording' | 'paused' | 'stopped' | 'processing';

export interface MediaDeviceInfoSimple {
  deviceId: string;
  label: string;
}

export interface StudioSettings {
  mode: RecordingMode;
  resolution: ResolutionPreset;
  frameRate: FrameRatePreset;
  format: OutputFormat;
  bitrateMbps: number;
  micEnabled: boolean;
  sysAudioEnabled: boolean;
  micDeviceId: string;
  camDeviceId: string;
  micVolume: number; // 0.0 to 2.0 (1.0 default)
  sysVolume: number; // 0.0 to 2.0 (1.0 default)
  camShape: CameraShape;
  camPosition: CameraPosition;
  camSize: CameraSize;
  mirrorCam: boolean;
  bakedCanvasCam: boolean; // if true, baked into video stream via canvas; else browser PiP
  countdownSeconds: number; // 0, 3, 5
  projectName: string;
}

export interface RecordingItem {
  id: string;
  name: string;
  timestamp: number;
  duration: number; // in seconds
  blob: Blob;
  url: string;
  format: OutputFormat;
  sizeBytes: number;
  width?: number;
  height?: number;
  mode: RecordingMode;
}
