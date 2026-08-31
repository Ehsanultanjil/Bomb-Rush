/**
 * Web Audio API Sound Synthesizer & Procedural Music Engine
 * Fully client-side with zero external audio assets.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  private musicIntervalId: number | null = null;
  private currentStep: number = 0;
  private isUrgent: boolean = false;
  private isPlayingMusic: boolean = false;

  constructor() {
    // Lazy initialize on first user gesture
  }

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.55;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.22;
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.sfxGain) {
      this.sfxGain.gain.value = enabled ? 0.55 : 0;
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicGain) {
      this.musicGain.gain.value = enabled ? 0.22 : 0;
    }
    if (!enabled) {
      this.stopMusic();
    } else if (this.isPlayingMusic) {
      this.startMusic(this.isUrgent);
    }
  }

  public ensureAudio() {
    this.init();
  }

  // === SFX METHODS ===

  public playButtonClick() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playBombPlaced() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);

    // Beep arming
    setTimeout(() => {
      if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
      const tNow = this.ctx.currentTime;
      const beep = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      beep.type = 'sine';
      beep.frequency.setValueAtTime(880, tNow);
      bGain.gain.setValueAtTime(0.25, tNow);
      bGain.gain.exponentialRampToValueAtTime(0.001, tNow + 0.06);
      beep.connect(bGain);
      bGain.connect(this.sfxGain);
      beep.start(tNow);
      beep.stop(tNow + 0.06);
    }, 120);
  }

  public playBombTick(isWarning: boolean = false) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(isWarning ? 1200 : 700, now);

    gain.gain.setValueAtTime(isWarning ? 0.25 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isWarning ? 0.04 : 0.025));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playExplosion(isChain: boolean = false) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const dur = isChain ? 0.45 : 0.6;

    // 1. Noise buffer for blast crunch
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1);
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + dur);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isChain ? 0.7 : 0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    // 2. Sub-bass drop oscillator
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(isChain ? 180 : 130, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + dur);

    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    whiteNoise.start(now);
    subOsc.start(now);

    whiteNoise.stop(now + dur);
    subOsc.stop(now + dur);
  }

  public playBlockDestroy() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const dur = 0.2;

    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + dur);
  }

  public playPowerUp() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.12);
    });
  }

  public playInvinciblePowerUp() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    // High energy rapid arpeggio fanfare (Star power theme)
    const starNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    starNotes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.2);
    });
  }

  public playEnemyDeath() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playPlayerHurt() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.setValueAtTime(120, now + 0.08);
    osc.frequency.setValueAtTime(70, now + 0.2);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playShieldBreak() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playLevelClear() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.50, d: 0.35 } // C6
    ];

    let offset = 0;
    notes.forEach((n) => {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + n.d);
      offset += n.d * 0.85;
    });
  }

  public playGameOver() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [392, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
    let offset = 0;
    notes.forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.35);
      offset += 0.25;
    });
  }

  public playCombo(multiplier: number) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const baseFreq = 440 * Math.pow(1.15, multiplier - 1);
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playCountdownBeep(isGo: boolean) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isGo ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.2);
    }

    gain.gain.setValueAtTime(isGo ? 0.5 : 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.3 : 0.15));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + (isGo ? 0.3 : 0.15));
  }

  // === PROCEDURAL ARCADE BACKGROUND MUSIC ===

  public startMusic(urgent: boolean = false) {
    this.isPlayingMusic = true;
    this.isUrgent = urgent;
    if (!this.musicEnabled) return;
    this.init();

    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }

    const tempoMs = urgent ? 110 : 150; // faster if urgent
    const bassNotesNormal = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83]; // A2, C3, D3, E3
    const leadNotesNormal = [440, 523.25, 587.33, 659.25, 587.33, 523.25, 440, 392];

    const bassNotesUrgent = [146.83, 146.83, 164.81, 174.61, 146.83, 174.61, 196, 220]; // D3, E3, F3, G3, A3
    const leadNotesUrgent = [587.33, 659.25, 698.46, 783.99, 880, 783.99, 698.46, 659.25];

    this.musicIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.musicEnabled) return;
      const now = this.ctx.currentTime;
      const step = this.currentStep % 8;
      this.currentStep++;

      const bassNotes = this.isUrgent ? bassNotesUrgent : bassNotesNormal;
      const leadNotes = this.isUrgent ? leadNotesUrgent : leadNotesNormal;

      // 1. Synth Bass
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassNotes[step], now);

      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(this.isUrgent ? 600 : 400, now);

      bassGain.gain.setValueAtTime(0.22, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + (tempoMs / 1000) * 0.85);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + (tempoMs / 1000) * 0.85);

      // 2. Chiptune Lead / Arpeggio (on alternate/sync steps)
      if (step % 2 === 0 || this.isUrgent) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadNotes[step], now);

        leadGain.gain.setValueAtTime(this.isUrgent ? 0.12 : 0.08, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + (tempoMs / 1000) * 0.5);

        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGain);

        leadOsc.start(now);
        leadOsc.stop(now + (tempoMs / 1000) * 0.5);
      }

      // 3. Subtle hi-hat tick
      if (step % 2 === 1) {
        const hhOsc = this.ctx.createOscillator();
        const hhGain = this.ctx.createGain();
        hhOsc.type = 'triangle';
        hhOsc.frequency.setValueAtTime(3500, now);
        hhGain.gain.setValueAtTime(0.04, now);
        hhGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        hhOsc.connect(hhGain);
        hhGain.connect(this.musicGain);
        hhOsc.start(now);
        hhOsc.stop(now + 0.03);
      }

    }, tempoMs);
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }
}

export const soundManager = new SoundManager();
