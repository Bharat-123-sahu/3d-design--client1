/**
 * Procedural Audio Synthesizer for tactile, joyful micro-interactions.
 * Zero external audio files required; generated dynamically via Web Audio API.
 */
class SoundEffectsManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
    // Check local storage for mute preference
    if (typeof localStorage !== "undefined") {
      this.muted = localStorage.getItem("bharat_portfolio_muted") === "true";
    }
  }

  _init() {
    if (this.ctx || typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.initialized = true;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("bharat_portfolio_muted", String(this.muted));
    }
    window.dispatchEvent(
      new CustomEvent("soundMuteChanged", { detail: { muted: this.muted } }),
    );
    if (!this.muted) {
      this.pipChirp();
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /**
   * Juicy squash-and-stretch cartoon boing / bubble pop for the 3D Jelly Ball.
   */
  jellyBoing(pitchMultiplier = 1.0) {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    // Pitch envelope: frequency sweeps rapidly downward and then bounces back
    const baseFreq = 260 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq * 1.8, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.28);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Crisp, tactile pop when a sticker attaches to the 3D surface.
   */
  stickerPop() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Cheerful high-pitch pip chirp / squeak when clicking or interacting with Pip!
   */
  pipChirp() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});

    const now = this.ctx.currentTime;
    // Two gentle harmonic chimes
    [0, 0.07].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const startFreq = idx === 0 ? 680 : 920;
      const endFreq = idx === 0 ? 880 : 1240;

      osc.frequency.setValueAtTime(startFreq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + delay + 0.08);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(0.18, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.13);
    });
  }

  /**
   * Sparkle chime for star bursts.
   */
  sparkleChime() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    const notes = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
    const freq = notes[Math.floor(Math.random() * notes.length)];
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.18);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  /**
   * Subtle Dragon Ball Super lightning rumble / zap.
   */
  thunderZap() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }
}

export const soundFX = new SoundEffectsManager();
