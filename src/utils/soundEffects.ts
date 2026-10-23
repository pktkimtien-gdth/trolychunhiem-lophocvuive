// Web Audio API synthesized playful sound effects
// Lightweight, zero external audio file dependencies, works across all browsers

class SoundController {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Check saved preference
    const saved = localStorage.getItem('vutoitruong_sound_enabled');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  private getAudioContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(val: boolean) {
    this.soundEnabled = val;
    localStorage.setItem('vutoitruong_sound_enabled', String(val));
  }

  public toggle(): boolean {
    this.setEnabled(!this.soundEnabled);
    if (this.soundEnabled) {
      this.playCoin();
    }
    return this.soundEnabled;
  }

  // Cute coin sound effect (bright bell ping-ding)
  public playCoin() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, now);
    osc2.frequency.exponentialRampToValueAtTime(1760.00, now + 0.12); // A6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.36);
  }

  // Big coin bonus fanfare (+5 xu or major prize)
  public playBigCoin() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [659.25, 783.99, 987.77, 1318.51, 1567.98]; // E5, G5, B5, E6, G6
    const startTime = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = startTime + i * 0.07;

      osc.type = i === notes.length - 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.31);
    });
  }

  // Triumphant victory fanfare when completing worksheet (>= 80%)
  public playWorksheetComplete() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Cheerful celebratory fanfare: C5, E5, G5, high C6, pause, G5, C6 (extended with sparkles)
    const sequence = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.50, d: 0.28 }, // C6
      { f: 880.00, d: 0.12 }, // A5
      { f: 1046.50, d: 0.12 }, // C6
      { f: 1318.51, d: 0.45 }, // E6
    ];

    let current = ctx.currentTime + 0.05;

    sequence.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, current);

      gain.gain.setValueAtTime(0.22, current);
      gain.gain.exponentialRampToValueAtTime(0.001, current + note.d + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(current);
      osc.stop(current + note.d + 0.12);
      current += note.d;
    });

    // Add playful sparkles after fanfare
    setTimeout(() => {
      this.playSparkle();
    }, 450);
  }

  // Sparkle chime
  public playSparkle() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
    const now = ctx.currentTime;

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  // Play correct sound (alias to sparkle)
  public playCorrect() {
    this.playSparkle();
  }

  // Play gentle alert sound
  public playWrong() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  // Click / Pop sound for buttons
  public playClick() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }
}

export const soundEffects = new SoundController();
