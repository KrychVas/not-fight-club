// --- AUDIO SYSTEM (Web Audio API Synthesizer & SFX Manager) ---

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.bgmVolume = 0.3;
    this.sfxVolume = 0.5;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Генерація синтезованого звуку удару (Punch SFX)
  playHitSound(isCrit = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = isCrit ? 'sawtooth' : 'triangle';
    
    // Частота падає для створення ефекту "удару"
    const startFreq = isCrit ? 350 : 180;
    const endFreq = 40;
    
    osc.frequency.setValueAtTime(startFreq, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.audioCtx.currentTime + (isCrit ? 0.3 : 0.15));

    gain.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + (isCrit ? 0.3 : 0.15));

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + (isCrit ? 0.3 : 0.15));
  }

  // Звук заблокованого удару (Block SFX - металевий глухий звук)
  playBlockSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(120, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(this.sfxVolume * 0.6, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  // Звук перемоги (Victory Fanfare)
  playVictorySound() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, index) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      const startTime = this.audioCtx.currentTime + index * 0.12;
      gain.gain.setValueAtTime(this.sfxVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // Звук поразки (Defeat SFX)
  playDefeatSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const notes = [300, 260, 220, 150];
    notes.forEach((freq, index) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const startTime = this.audioCtx.currentTime + index * 0.18;
      gain.gain.setValueAtTime(this.sfxVolume * 0.7, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  toggleMute(status) {
    this.isMuted = status;
  }
}

export const soundManager = new SoundManager();