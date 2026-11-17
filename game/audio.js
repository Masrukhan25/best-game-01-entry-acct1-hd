// VOIDLIGHT — WebAudio synth sound: every effect is synthesised, no audio files.
// Music is a dark synthwave loop: a driving bass line, a soft pad and a bright
// arpeggio, scheduled ahead in small slices so it never drifts.

export function makeAudio() {
  const audio = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    muted: false,
    musicOn: false,
    musicTimer: 0,
    nextNoteTime: 0,
    step: 0,
    // Bass line in A minor, 8 steps a bar, 4 bars.
    bassNotes: [55, 55, 65.41, 55, 49, 55, 82.41, 73.42, 55, 55, 65.41, 55, 49, 55, 98, 87.31],
    arpNotes: [220, 261.63, 329.63, 440, 523.25, 440, 329.63, 261.63],
    padNotes: [110, 130.81, 164.81, 220],
  };

  audio.ensure = function ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.master);
      return true;
    } catch {
      return false;
    }
  };

  audio.setMuted = function setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
  };

  // A short oscillator blip with a pitch slide and an exponential fade.
  audio.blip = function blip(freqA, freqB, dur, type, vol, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqA, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqB), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  };

  // Filtered noise burst (explosions, hits).
  audio.noise = function noise(dur, vol, filterFreq, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t0);
  };

  audio.shoot = function shoot() {
    this.blip(880, 240, 0.09, 'square', 0.11);
  };
  audio.enemyHit = function enemyHit() {
    this.noise(0.07, 0.16, 2600);
  };
  audio.explosion = function explosion(big) {
    this.noise(big ? 0.55 : 0.3, big ? 0.5 : 0.3, big ? 900 : 1400);
    this.blip(big ? 160 : 220, 40, big ? 0.5 : 0.28, 'sine', big ? 0.5 : 0.3);
  };
  audio.playerHit = function playerHit() {
    this.blip(320, 60, 0.3, 'sawtooth', 0.35);
    this.noise(0.22, 0.3, 1100);
  };
  audio.powerup = function powerup() {
    this.blip(523.25, 523.25, 0.08, 'sine', 0.22);
    this.blip(659.25, 659.25, 0.08, 'sine', 0.22, 0.07);
    this.blip(783.99, 783.99, 0.14, 'sine', 0.24, 0.14);
  };
  audio.waveClear = function waveClear() {
    this.blip(392, 392, 0.12, 'triangle', 0.25);
    this.blip(523.25, 523.25, 0.12, 'triangle', 0.25, 0.1);
    this.blip(659.25, 659.25, 0.2, 'triangle', 0.25, 0.2);
  };
  audio.bossAlarm = function bossAlarm() {
    this.blip(220, 220, 0.22, 'sawtooth', 0.28);
    this.blip(220, 220, 0.22, 'sawtooth', 0.28, 0.3);
    this.blip(330, 330, 0.35, 'sawtooth', 0.28, 0.6);
  };
  audio.upgrade = function upgrade() {
    this.blip(440, 880, 0.16, 'triangle', 0.25);
    this.blip(660, 1320, 0.2, 'triangle', 0.2, 0.08);
  };
  audio.gameOver = function gameOver() {
    this.blip(392, 98, 0.9, 'sawtooth', 0.3);
    this.blip(196, 49, 1.1, 'triangle', 0.25, 0.15);
  };
  audio.victory = function victory() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.blip(f, f, 0.3, 'triangle', 0.25, i * 0.14));
  };

  // Music: schedule 8th-note steps ahead. Called every frame while playing.
  audio.updateMusic = function updateMusic(dt) {
    if (!this.ctx || this.muted || !this.musicOn) return;
    const stepDur = 60 / 132 / 2; // 132 BPM, 8th notes
    this.nextNoteTime = Math.max(this.nextNoteTime, this.ctx.currentTime + 0.05);
    while (this.nextNoteTime < this.ctx.currentTime + 0.18) {
      const s = this.step;
      const t0 = this.nextNoteTime;
      // Bass on every step.
      const bass = this.bassNotes[s % this.bassNotes.length];
      this.toneAt(bass, t0, stepDur * 0.95, 'triangle', 0.5);
      // Arpeggio on off steps, quiet and bright.
      if (s % 2 === 1) {
        const arp = this.arpNotes[(s >> 1) % this.arpNotes.length] * 2;
        this.toneAt(arp, t0, stepDur * 0.7, 'sine', 0.12);
      }
      // Pad at the start of each 8-step bar.
      if (s % 8 === 0) {
        for (const p of this.padNotes) this.toneAt(p, t0, stepDur * 8, 'sine', 0.05);
      }
      this.nextNoteTime += stepDur;
      this.step++;
    }
  };

  audio.toneAt = function toneAt(freq, t0, dur, type, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  };

  audio.startMusic = function startMusic() {
    if (!this.ensure()) return;
    this.musicOn = true;
    this.nextNoteTime = this.ctx.currentTime + 0.06;
    this.step = 0;
  };

  audio.stopMusic = function stopMusic() {
    this.musicOn = false;
  };

  return audio;
}
