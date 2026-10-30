// Tích trò "Rồng Phun Nước Giữ Đình" — logic thuần, không vẽ.
// Rồng rối bơi dọc ao, phun nước dập lửa trên các công trình di sản bên bờ.
// Mô hình FL-1 của HeriTrust báo trước nơi sắp cháy: tưới ướt công trình trong lúc
// cảnh báo thì ngọn lửa không bùng lên được (giá trị của cảnh báo sớm).

import { STAGE_W, WATER_Y } from "../engine";

export const ROUND_TIME = 75;
export const DRAGON_MIN_X = 70;
export const DRAGON_MAX_X = STAGE_W - 70;
export const SPRAY_REACH = 62;
export const WARN_TIME = 2.6;

export type DragonEvent =
  | "warn"
  | "ignite"
  | "prevented"
  | "extinguished"
  | "lost"
  | "spread"
  | "end";

export interface DragonInput {
  /** -1 (trái) … 1 (phải) */
  moveAxis: number;
  /** giữ để phun nước */
  sprayHeld: boolean;
}

export interface Site {
  name: string;
  kind: "dinh" | "chua" | "thap" | "nha" | "cong";
  x: number;
  /** độ nguyên vẹn 0–100; về 0 là sập */
  hp: number;
  /** cường độ lửa 0–1, 0 = không cháy */
  fire: number;
  /** thời gian còn lại của cảnh báo FL-1, 0 = không cảnh báo */
  warn: number;
  /** độ ẩm do được tưới, 0–1: ướt thì khó bắt lửa */
  wet: number;
  /** rủi ro dự báo của FL-1, 0–1 */
  risk: number;
  lost: boolean;
}

export const SITE_DEFS: Pick<Site, "name" | "kind" | "x" | "risk">[] = [
  { name: "Đình làng", kind: "dinh", x: 150, risk: 0.55 },
  { name: "Chùa cổ", kind: "chua", x: 320, risk: 0.8 },
  { name: "Tháp chuông", kind: "thap", x: 490, risk: 0.35 },
  { name: "Nhà rường", kind: "nha", x: 655, risk: 0.7 },
  { name: "Cổng tam quan", kind: "cong", x: 820, risk: 0.45 },
];

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export class DragonEngine {
  t = 0;
  timeLeft = ROUND_TIME;
  dragon = { x: 480, vx: 0, bob: 0, spraying: false };
  water = 1;
  sites: Site[] = [];
  sparks: Spark[] = [];
  prevented = 0;
  extinguished = 0;
  nextWarn = 2.2;
  done = false;
  events: DragonEvent[] = [];
  private rnd = rand(1);

  constructor(seed = 20260325) {
    this.reset(seed);
  }

  reset(seed = 20260325) {
    this.rnd = rand(seed);
    this.t = 0;
    this.timeLeft = ROUND_TIME;
    this.dragon = { x: 480, vx: 0, bob: 0, spraying: false };
    this.water = 1;
    this.sites = SITE_DEFS.map((d) => ({ ...d, hp: 100, fire: 0, warn: 0, wet: 0, lost: false }));
    this.sparks = [];
    this.prevented = 0;
    this.extinguished = 0;
    this.nextWarn = 2.2;
    this.done = false;
    this.events = [];
  }

  /** Công trình mà vòi nước của rồng đang chạm tới (nếu có). */
  target(): Site | undefined {
    return this.sites.find((s) => !s.lost && Math.abs(s.x - this.dragon.x) < SPRAY_REACH);
  }

  standing() {
    return this.sites.filter((s) => !s.lost).length;
  }

  /** Điểm 0–100: độ nguyên vẹn trung bình + thưởng phòng ngừa. */
  score() {
    const avg = this.sites.reduce((a, s) => a + (s.lost ? 0 : s.hp), 0) / this.sites.length;
    return Math.max(0, Math.min(100, Math.round(avg + this.prevented * 4)));
  }

  won() {
    return this.standing() >= 3;
  }

  /** Chọn nơi cảnh báo theo rủi ro dự báo (rủi ro cao hay bị chọn hơn). */
  private pickWarnSite(): Site | undefined {
    const pool = this.sites.filter((s) => !s.lost && s.fire === 0 && s.warn === 0);
    const total = pool.reduce((a, s) => a + s.risk, 0);
    let r = this.rnd() * total;
    for (const s of pool) {
      r -= s.risk;
      if (r <= 0) return s;
    }
    return pool.at(-1);
  }

  private burst(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      this.sparks.push({
        x,
        y,
        vx: (this.rnd() - 0.5) * 80,
        vy: -40 - this.rnd() * 70,
        life: 0.5 + this.rnd() * 0.5,
      });
    }
  }

  update(dt: number, input: DragonInput) {
    this.t += dt;
    if (this.done) {
      this.updateSparks(dt);
      return;
    }
    this.timeLeft = Math.max(0, this.timeLeft - dt);

    // ---- rồng bơi ----
    const target = input.moveAxis * 260;
    this.dragon.vx += (target - this.dragon.vx) * Math.min(1, dt * 6);
    this.dragon.x = Math.max(
      DRAGON_MIN_X,
      Math.min(DRAGON_MAX_X, this.dragon.x + this.dragon.vx * dt),
    );
    this.dragon.bob = Math.sin(this.t * 3.1) * 4;

    // ---- phun nước: tốn nước, ngừng phun thì rồng ngụp xuống ao lấy lại ----
    this.dragon.spraying = input.sprayHeld && this.water > 0.02;
    if (this.dragon.spraying) {
      this.water = Math.max(0, this.water - dt * 0.32);
      const s = this.target();
      if (s) {
        s.wet = Math.min(1, s.wet + dt * 1.6);
        if (s.fire > 0) {
          s.fire = Math.max(0, s.fire - dt * 0.75);
          if (s.fire === 0) {
            this.extinguished++;
            this.events.push("extinguished");
          }
        } else if (s.warn > 0 && s.wet >= 0.6) {
          s.warn = 0;
          this.prevented++;
          this.events.push("prevented");
        }
      }
    } else {
      this.water = Math.min(1, this.water + dt * 0.24);
    }

    // ---- cảnh báo FL-1 ----
    this.nextWarn -= dt;
    if (this.nextWarn <= 0) {
      const s = this.pickWarnSite();
      if (s) {
        s.warn = WARN_TIME;
        this.events.push("warn");
      }
      // càng về cuối càng dồn dập
      const pace = 1 - (ROUND_TIME - this.timeLeft) / ROUND_TIME;
      this.nextWarn = 2.4 + pace * 2.6 + this.rnd() * 1.4;
    }

    // ---- công trình ----
    for (const s of this.sites) {
      if (s.lost) continue;
      if (!this.dragon.spraying || this.target() !== s) s.wet = Math.max(0, s.wet - dt * 0.12);

      if (s.warn > 0) {
        s.warn -= dt;
        if (s.warn <= 0) {
          s.warn = 0;
          // tưới ướt một phần vẫn có ích: lửa bén yếu hơn
          s.fire = 0.35 + 0.35 * (1 - s.wet);
          this.events.push("ignite");
          this.burst(s.x, WATER_Y - 60, 10);
        }
      }

      if (s.fire > 0) {
        const growing = !(this.dragon.spraying && this.target() === s);
        if (growing) s.fire = Math.min(1, s.fire + dt * 0.07);
        s.hp = Math.max(0, s.hp - s.fire * dt * 9);
        if (this.rnd() < dt * 6 * s.fire)
          this.burst(s.x + (this.rnd() - 0.5) * 50, WATER_Y - 70, 1);

        // lửa to bắt sang công trình bên cạnh
        if (s.fire > 0.85 && this.rnd() < dt * 0.25) {
          const i = this.sites.indexOf(s);
          const n = this.sites[i + (this.rnd() < 0.5 ? -1 : 1)];
          if (n && !n.lost && n.fire === 0 && n.warn === 0 && n.wet < 0.5) {
            n.warn = WARN_TIME * 0.6;
            this.events.push("spread");
          }
        }

        if (s.hp <= 0) {
          s.lost = true;
          s.fire = 0;
          s.warn = 0;
          this.events.push("lost");
          this.burst(s.x, WATER_Y - 40, 18);
        }
      }
    }

    this.updateSparks(dt);

    if (this.timeLeft <= 0 || this.standing() < 3) {
      this.done = true;
      this.events.push("end");
    }
  }

  private updateSparks(dt: number) {
    for (const p of this.sparks) {
      p.vy += 30 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.sparks = this.sparks.filter((p) => p.life > 0);
  }
}
