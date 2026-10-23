import { CameraPosition, CameraShape, CameraSize } from './types';

export interface CanvasCompositorOptions {
  width: number;
  height: number;
  frameRate: number;
  shape: CameraShape;
  position: CameraPosition;
  size: CameraSize;
  mirrorCam: boolean;
}

export class CanvasCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private screenVideo: HTMLVideoElement | null = null;
  private camVideo: HTMLVideoElement | null = null;
  private animFrameId: number | null = null;
  private worker: Worker | null = null;
  private workerUrl: string | null = null;
  private options: CanvasCompositorOptions;
  private active = false;

  constructor(options: CanvasCompositorOptions) {
    this.options = options;
    this.canvas = document.createElement('canvas');
    this.canvas.width = options.width;
    this.canvas.height = options.height;
    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = context;
  }

  updateOptions(options: Partial<CanvasCompositorOptions>) {
    this.options = { ...this.options, ...options };
    if (options.width && options.height) {
      this.canvas.width = options.width;
      this.canvas.height = options.height;
    }
  }

  start(screenStream: MediaStream, camStream?: MediaStream | null): MediaStreamTrack {
    this.active = true;

    // Create and attach screen video off-screen in DOM to prevent browser decoding throttle
    this.screenVideo = document.createElement('video');
    this.screenVideo.muted = true;
    this.screenVideo.playsInline = true;
    this.screenVideo.autoplay = true;
    this.screenVideo.style.position = 'fixed';
    this.screenVideo.style.top = '-9999px';
    this.screenVideo.style.left = '-9999px';
    this.screenVideo.style.width = '2px';
    this.screenVideo.style.height = '2px';
    this.screenVideo.style.opacity = '0.001';
    this.screenVideo.style.pointerEvents = 'none';
    document.body.appendChild(this.screenVideo);
    this.screenVideo.srcObject = screenStream;
    this.screenVideo.play().catch(console.error);

    // Create and attach cam video if provided
    if (camStream) {
      this.camVideo = document.createElement('video');
      this.camVideo.muted = true;
      this.camVideo.playsInline = true;
      this.camVideo.autoplay = true;
      this.camVideo.style.position = 'fixed';
      this.camVideo.style.top = '-9999px';
      this.camVideo.style.left = '-9999px';
      this.camVideo.style.width = '2px';
      this.camVideo.style.height = '2px';
      this.camVideo.style.opacity = '0.001';
      this.camVideo.style.pointerEvents = 'none';
      document.body.appendChild(this.camVideo);
      this.camVideo.srcObject = camStream;
      this.camVideo.play().catch(console.error);
    }

    // Auto-adjust canvas dimensions once screen video metadata loads
    this.screenVideo.onloadedmetadata = () => {
      if (this.screenVideo && this.screenVideo.videoWidth && this.screenVideo.videoHeight) {
        if (this.options.width >= 9999) {
          this.canvas.width = this.screenVideo.videoWidth;
          this.canvas.height = this.screenVideo.videoHeight;
        }
      }
    };

    // 1. Web Worker clock: immune to tab switching and background throttling!
    try {
      const workerScript = `
        var timer = null;
        self.onmessage = function(e) {
          if (e.data.action === 'start') {
            var interval = Math.max(10, Math.floor(1000 / (e.data.fps || 60)));
            if (timer) clearInterval(timer);
            timer = setInterval(function() {
              self.postMessage('tick');
            }, interval);
          } else if (e.data.action === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(this.workerUrl);

      this.worker.onmessage = () => {
        if (!this.active) return;
        // When tab is hidden/backgrounded, requestAnimationFrame freezes completely.
        // The worker tick guarantees frames continue drawing without lagging!
        if (document.hidden) {
          this.draw();
        }
      };

      this.worker.postMessage({ action: 'start', fps: this.options.frameRate });
    } catch (e) {
      console.warn('Web Worker timer initialization warning:', e);
    }

    // 2. requestAnimationFrame clock for smooth v-synced rendering when tab is visible
    const render = () => {
      if (!this.active) return;
      if (!document.hidden) {
        this.draw();
      }
      this.animFrameId = requestAnimationFrame(render);
    };

    this.animFrameId = requestAnimationFrame(render);

    const stream = this.canvas.captureStream(this.options.frameRate);
    return stream.getVideoTracks()[0];
  }

  private draw() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // Draw background screen
    if (this.screenVideo && this.screenVideo.readyState >= 2) {
      ctx.drawImage(this.screenVideo, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#0f111a';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw webcam overlay if enabled
    if (this.camVideo && this.camVideo.readyState >= 2) {
      this.drawCameraOverlay();
    }
  }

  private drawCameraOverlay() {
    if (!this.camVideo) return;
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const { shape, position, size, mirrorCam } = this.options;

    // Determine camera dimensions based on canvas resolution
    const baseDimension = Math.min(width, height);
    let overlaySize = Math.round(baseDimension * 0.22); // medium default (~230px on 1080p)
    if (size === 'small') overlaySize = Math.round(baseDimension * 0.16);
    if (size === 'large') overlaySize = Math.round(baseDimension * 0.28);

    const margin = Math.round(baseDimension * 0.035); // 3.5% margin

    let x = width - overlaySize - margin;
    let y = height - overlaySize - margin;

    if (position === 'bottom-left') {
      x = margin;
      y = height - overlaySize - margin;
    } else if (position === 'top-right') {
      x = width - overlaySize - margin;
      y = margin;
    } else if (position === 'top-left') {
      x = margin;
      y = margin;
    }

    ctx.save();

    // Drop shadow behind camera
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    // Clip path based on shape
    ctx.beginPath();
    if (shape === 'circle') {
      const radius = overlaySize / 2;
      ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
    } else if (shape === 'rounded') {
      const r = Math.round(overlaySize * 0.16);
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, overlaySize, overlaySize, r);
      } else {
        ctx.rect(x, y, overlaySize, overlaySize);
      }
    } else {
      ctx.rect(x, y, overlaySize, overlaySize);
    }
    ctx.closePath();

    // Fill background of frame
    ctx.fillStyle = '#000000';
    ctx.fill();

    // Reset shadow for video drawing
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.clip();

    // Draw camera video with aspect ratio crop (cover)
    const vw = this.camVideo.videoWidth || 1;
    const vh = this.camVideo.videoHeight || 1;
    const aspect = vw / vh;

    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (aspect > 1) {
      sw = vh;
      sx = (vw - vh) / 2;
    } else {
      sh = vw;
      sy = (vh - vw) / 2;
    }

    if (mirrorCam) {
      ctx.translate(x + overlaySize, y);
      ctx.scale(-1, 1);
      ctx.drawImage(this.camVideo, sx, sy, sw, sh, 0, 0, overlaySize, overlaySize);
    } else {
      ctx.drawImage(this.camVideo, sx, sy, sw, sh, x, y, overlaySize, overlaySize);
    }

    ctx.restore();

    // Outer border ring
    ctx.save();
    ctx.lineWidth = Math.max(3, Math.round(overlaySize * 0.018));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    if (shape === 'circle') {
      const radius = overlaySize / 2;
      ctx.arc(x + radius, y + radius, radius - ctx.lineWidth / 2, 0, Math.PI * 2);
    } else if (shape === 'rounded') {
      const r = Math.round(overlaySize * 0.16);
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x + 1, y + 1, overlaySize - 2, overlaySize - 2, r);
      } else {
        ctx.rect(x, y, overlaySize, overlaySize);
      }
    } else {
      ctx.rect(x + 1, y + 1, overlaySize - 2, overlaySize - 2);
    }
    ctx.stroke();
    ctx.restore();
  }

  stop() {
    this.active = false;

    if (this.worker) {
      this.worker.postMessage({ action: 'stop' });
      this.worker.terminate();
      this.worker = null;
    }
    if (this.workerUrl) {
      URL.revokeObjectURL(this.workerUrl);
      this.workerUrl = null;
    }

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.screenVideo) {
      this.screenVideo.pause();
      this.screenVideo.srcObject = null;
      if (this.screenVideo.parentNode) {
        this.screenVideo.parentNode.removeChild(this.screenVideo);
      }
      this.screenVideo = null;
    }

    if (this.camVideo) {
      this.camVideo.pause();
      this.camVideo.srcObject = null;
      if (this.camVideo.parentNode) {
        this.camVideo.parentNode.removeChild(this.camVideo);
      }
      this.camVideo = null;
    }
  }
}
