class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.isSFXMuted = false;
    this.isBGMMuted = false;
    this.sfxVolume = 0.5;

    this.tracks = {
      menu: new Audio('assets/audio/Common Fight.ogg'),     
      select: new Audio('assets/audio/Central City.ogg'),  
      battle: new Audio('assets/audio/Chiptronical.ogg'),  
      boss: new Audio('assets/audio/Boss Fight.ogg'),     
      gameOver: new Audio('assets/audio/Game Over.ogg')   
    };

    ['menu', 'select', 'battle', 'boss'].forEach(key => {
      this.tracks[key].loop = true;
      this.tracks[key].volume = 0.25;
    });

    this.tracks.gameOver.volume = 0.4;
    this.currentTrack = null;
    this.currentTrackKey = null;
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

  playBGM(trackKey = 'menu') {
    if (this.isBGMMuted || !this.tracks[trackKey]) return;

    if (this.currentTrackKey === trackKey && this.currentTrack && !this.currentTrack.paused) {
      return;
    }

    this.stopBGM();

    this.currentTrackKey = trackKey;
    this.currentTrack = this.tracks[trackKey];
    this.currentTrack.currentTime = 0;

    this.currentTrack.play().catch(err => {
      console.log(`BGM [${trackKey}] play blocked by browser interaction policy:`, err);
    });
  }

  stopBGM() {
    if (this.currentTrack) {
      this.currentTrack.pause();
      this.currentTrack.currentTime = 0;
      this.currentTrack = null;
      this.currentTrackKey = null;
    }
  }

  toggleBGM(isMuted) {
    this.isBGMMuted = isMuted;
    if (isMuted) {
      this.stopBGM();
    } else {
      this.playBGM(this.currentTrackKey || 'menu');
    }
  }

  toggleSFX(isMuted) {
    this.isSFXMuted = isMuted;
  }

  playHitSound(isCrit = false) {
    if (this.isSFXMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = isCrit ? 'sawtooth' : 'triangle';
    
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

  playBlockSound() {
    if (this.isSFXMuted) return;
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

  playVictorySound() {
    if (this.isSFXMuted) return;
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

  playDefeatSound() {
    this.stopBGM();
    if (!this.isBGMMuted) {
      this.tracks.gameOver.currentTime = 0;
      this.tracks.gameOver.play().catch(() => {});
    }
  }
}

export const soundManager = new SoundManager();