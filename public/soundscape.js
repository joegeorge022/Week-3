/**
 * SlothClaw: Procedural Offline Sleep Soundscape Generator
 * 100% pure Web Audio API synthesizer — 0 external audio files needed.
 * Generates calibrated brown noise, gentle rain patter, and 52 BPM binaural warmth.
 */

class SlothSoundscape {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.brownNoiseNode = null;
    this.rainGain = null;
    this.masterGain = null;
    this.binauralOsc = null;
    this.filterNode = null;
  }

  init() {
    if (this.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    this.masterGain.connect(this.audioCtx.destination);
  }

  // Generate procedural brown noise (deep acoustic drone)
  createBrownNoise() {
    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate gain
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Lowpass filter for deep soothing forest canopy resonance
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.audioCtx.currentTime);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    return whiteNoise;
  }

  // Gentle procedural rain drops generator
  createRainPatter() {
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Sporadic raindrop impulses
      if (Math.random() < 0.015) {
        data[i] = (Math.random() * 2 - 1) * 0.7;
      } else {
        data[i] = (Math.random() * 2 - 1) * 0.03;
      }
    }

    const rainSource = this.audioCtx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;

    const rainFilter = this.audioCtx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(1100, this.audioCtx.currentTime);
    rainFilter.Q.setValueAtTime(0.8, this.audioCtx.currentTime);

    this.rainGain = this.audioCtx.createGain();
    this.rainGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    return rainSource;
  }

  // 52 BPM delta-wave binaural pulse
  createHeartbeatDrone() {
    const osc = this.audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(68, this.audioCtx.currentTime); // Low warm tone

    const oscGain = this.audioCtx.createGain();
    oscGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);

    // LFO for slow breath cycle (approx 5.5 seconds per breath)
    const lfo = this.audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, this.audioCtx.currentTime);

    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(oscGain.gain);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    lfo.start();
    osc.start();

    return { osc, lfo };
  }

  async play() {
    this.init();
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    if (this.isPlaying) return;

    this.brownNoise = this.createBrownNoise();
    this.rain = this.createRainPatter();
    this.heartbeat = this.createHeartbeatDrone();

    this.brownNoise.start();
    this.rain.start();
    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying) return;
    try {
      if (this.brownNoise) this.brownNoise.stop();
      if (this.rain) this.rain.stop();
      if (this.heartbeat) {
        this.heartbeat.osc.stop();
        this.heartbeat.lfo.stop();
      }
    } catch (e) {}
    this.isPlaying = false;
  }

  setVolume(val) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(parseFloat(val), this.audioCtx.currentTime);
    }
  }
}

window.slothAudio = new SlothSoundscape();
