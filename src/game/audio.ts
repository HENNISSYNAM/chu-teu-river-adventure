// Nhạc dân gian + hiệu ứng âm thanh tổng hợp bằng WebAudio (không cần file ngoài)
const PENTA = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99];

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private beatTimer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  ensure() {
    if (this.ctx) return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.35;
    this.master.connect(this.ctx.destination);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.35, this.ctx.currentTime, 0.05);
    }
  }

  start() {
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (this.beatTimer) return;
    this.beatTimer = setInterval(() => this.beat(), 470);
  }

  stop() {
    if (this.beatTimer) {
      clearInterval(this.beatTimer);
      this.beatTimer = null;
    }
  }

  private beat() {
    if (!this.ctx || this.muted) return;
    const s = this.step++;
    // trống hội
    if (s % 2 === 0) this.drum(0.5);
    if (s % 8 === 4) this.drum(0.8);
    // mõ gỗ
    if (s % 2 === 1) this.woodblock(0.25);
    // tiếng pluck ngũ cung thưa thớt
    if (Math.random() < 0.42) {
      const note = PENTA[Math.floor(Math.random() * PENTA.length)];
      this.pluck(note, 0.16);
    }
    if (s % 16 === 12 && Math.random() < 0.6) {
      this.pluck(PENTA[2 + Math.floor(Math.random() * 2)] * 2, 0.1);
    }
  }

  private drum(v: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.18);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.25);
  }

  private woodblock(v: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(880, t);
    g.gain.setValueAtTime(v * 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.06);
  }

  private pluck(freq: number, v: number, when = 0) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.55);
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(freq * 2.01, t);
    g2.gain.setValueAtTime(v * 0.3, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o2.connect(g2).connect(this.master!);
    o2.start(t);
    o2.stop(t + 0.3);
  }

  private noise(v: number, dur: number, from: number, to: number) {
    const ctx = this.ctx!;
    if (!this.noiseBuf) {
      const len = ctx.sampleRate * 0.5;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 0.8;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  splash() {
    if (!this.ctx || this.muted) return;
    this.noise(0.5, 0.3, 2200, 350);
  }
  drop() {
    if (!this.ctx || this.muted) return;
    this.noise(0.25, 0.16, 2600, 700);
  }
  bite() {
    if (!this.ctx || this.muted) return;
    this.pluck(1046, 0.22);
    this.pluck(1318, 0.22, 0.1);
  }
  caught() {
    if (!this.ctx || this.muted) return;
    this.splash();
    this.pluck(659, 0.2, 0.05);
    this.pluck(784, 0.2, 0.16);
    this.pluck(1046, 0.24, 0.27);
  }
  thud() {
    if (!this.ctx || this.muted) return;
    this.drum(0.9);
    this.noise(0.2, 0.12, 300, 120);
  }
  goal() {
    if (!this.ctx || this.muted) return;
    this.pluck(523, 0.2);
    this.pluck(659, 0.2, 0.12);
    this.pluck(784, 0.24, 0.24);
  }
  win() {
    if (!this.ctx || this.muted) return;
    const seq = [523, 659, 784, 1046, 784, 1046, 1318];
    seq.forEach((f, i) => this.pluck(f, 0.22, i * 0.14));
    this.drum(0.7);
  }
}
