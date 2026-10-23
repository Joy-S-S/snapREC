export class AudioMixer {
  private ctx: AudioContext | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private sysSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private sysGain: GainNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private sysAnalyser: AnalyserNode | null = null;
  private micDataArray: Uint8Array | null = null;
  private sysDataArray: Uint8Array | null = null;

  async init(options: {
    micStream?: MediaStream | null;
    sysStream?: MediaStream | null;
    micVolume?: number;
    sysVolume?: number;
  }): Promise<MediaStreamTrack | null> {
    const hasMicAudio = !!(options.micStream && options.micStream.getAudioTracks().length > 0);
    const hasSysAudio = !!(options.sysStream && options.sysStream.getAudioTracks().length > 0);

    if (!hasMicAudio && !hasSysAudio) {
      return null;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.destination = this.ctx.createMediaStreamDestination();

    if (hasMicAudio && options.micStream) {
      this.micSource = this.ctx.createMediaStreamSource(new MediaStream([options.micStream.getAudioTracks()[0]]));
      this.micGain = this.ctx.createGain();
      this.micGain.gain.value = options.micVolume ?? 1.0;

      this.micAnalyser = this.ctx.createAnalyser();
      this.micAnalyser.fftSize = 64;
      this.micAnalyser.smoothingTimeConstant = 0.8;
      this.micDataArray = new Uint8Array(this.micAnalyser.frequencyBinCount);

      this.micSource.connect(this.micGain);
      this.micGain.connect(this.destination);
      this.micGain.connect(this.micAnalyser);
    }

    if (hasSysAudio && options.sysStream) {
      this.sysSource = this.ctx.createMediaStreamSource(new MediaStream([options.sysStream.getAudioTracks()[0]]));
      this.sysGain = this.ctx.createGain();
      this.sysGain.gain.value = options.sysVolume ?? 1.0;

      this.sysAnalyser = this.ctx.createAnalyser();
      this.sysAnalyser.fftSize = 64;
      this.sysAnalyser.smoothingTimeConstant = 0.8;
      this.sysDataArray = new Uint8Array(this.sysAnalyser.frequencyBinCount);

      this.sysSource.connect(this.sysGain);
      this.sysGain.connect(this.destination);
      this.sysGain.connect(this.sysAnalyser);
    }

    const tracks = this.destination.stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }

  setMicVolume(volume: number) {
    if (this.micGain) {
      this.micGain.gain.value = Math.max(0, Math.min(2, volume));
    }
  }

  setSysVolume(volume: number) {
    if (this.sysGain) {
      this.sysGain.gain.value = Math.max(0, Math.min(2, volume));
    }
  }

  getLevels(): { micLevel: number; sysLevel: number } {
    let micLevel = 0;
    let sysLevel = 0;

    if (this.micAnalyser && this.micDataArray) {
      this.micAnalyser.getByteFrequencyData(this.micDataArray);
      let sum = 0;
      for (let i = 0; i < this.micDataArray.length; i++) {
        sum += this.micDataArray[i];
      }
      micLevel = Math.min(100, Math.round((sum / (this.micDataArray.length * 255)) * 140));
    }

    if (this.sysAnalyser && this.sysDataArray) {
      this.sysAnalyser.getByteFrequencyData(this.sysDataArray);
      let sum = 0;
      for (let i = 0; i < this.sysDataArray.length; i++) {
        sum += this.sysDataArray[i];
      }
      sysLevel = Math.min(100, Math.round((sum / (this.sysDataArray.length * 255)) * 140));
    }

    return { micLevel, sysLevel };
  }

  close() {
    try {
      if (this.micSource) this.micSource.disconnect();
      if (this.sysSource) this.sysSource.disconnect();
      if (this.micGain) this.micGain.disconnect();
      if (this.sysGain) this.sysGain.disconnect();
      if (this.micAnalyser) this.micAnalyser.disconnect();
      if (this.sysAnalyser) this.sysAnalyser.disconnect();
      if (this.destination) this.destination.disconnect();
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close();
      }
    } catch (e) {
      console.warn('AudioMixer cleanup warning:', e);
    }
    this.ctx = null;
    this.destination = null;
  }
}
