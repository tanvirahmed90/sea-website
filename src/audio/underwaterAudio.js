/**
 * Web Audio API synthesized ambient underwater soundscape.
 * Generates an atmospheric deep-ocean drone, water wash, and subtle resonance.
 * 100% self-contained, no external audio files needed!
 */

export class UnderwaterAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.filter = null;
    this.droneGain = null;
    this.noiseGain = null;
    this.oscillators = [];
    this.noiseSource = null;
    this.onStateChange = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn('Web Audio API not supported in this browser.');
      return;
    }
    this.ctx = new AudioContext();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Dynamic underwater low-pass filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(2.5, this.ctx.currentTime);
    this.filter.connect(this.masterGain);

    // --- 1. Sub-bass oceanic drone ---
    const f1 = 52.0; // Sub-bass root
    const f2 = 55.4; // Binaural beat ~3.4Hz
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(f1, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(f2, this.ctx.currentTime);

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    osc1.connect(this.droneGain);
    osc2.connect(this.droneGain);
    this.droneGain.connect(this.filter);

    osc1.start();
    osc2.start();
    this.oscillators.push(osc1, osc2);

    // --- 2. Low-frequency pink noise for oceanic currents ---
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.noiseSource.connect(this.noiseGain);
    this.noiseGain.connect(this.filter);
    this.noiseSource.start();

    // Slow LFO for subtle breathing current
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(60, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    lfo.start();
    this.oscillators.push(lfo);
  }

  async toggle() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) {
      // Fade out
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.8);
      this.isPlaying = false;
    } else {
      // Fade in
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(0.42, now + 1.2);
      this.isPlaying = true;
    }

    if (this.onStateChange) {
      this.onStateChange(this.isPlaying);
    }
    return this.isPlaying;
  }

  updateDepth(depthRatio) {
    if (!this.filter || !this.ctx || !this.isPlaying) return;
    // As you dive deeper, high frequencies are absorbed more, pressure rises
    // depthRatio: 0 (surface) to 1 (abyss)
    const targetFreq = 480 - depthRatio * 320; // 480Hz down to 160Hz
    const now = this.ctx.currentTime;
    this.filter.frequency.setTargetAtTime(targetFreq, now, 0.4);
  }

  triggerBubblePing() {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      
      const startFreq = 400 + Math.random() * 300;
      const endFreq = startFreq + 150 + Math.random() * 100;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Audio context might be busy or transitioning
    }
  }
}

export const audioSystem = new UnderwaterAudio();
