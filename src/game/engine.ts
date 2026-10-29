// Đêm Hội Rối Nước — game engine (logic only, no rendering)

export const STAGE_W = 960;
export const STAGE_H = 600;
export const WATER_Y = 218;
export const BOAT_MIN_X = 80;
export const BOAT_MAX_X = 900;
export const DOCK_X = 862;

export type GameEvent =
  | "bite"
  | "catch"
  | "collide"
  | "empty"
  | "escape"
  | "goal-dock"
  | "win";

export interface InputState {
  /** -1 (trái) … 1 (phải) */
  moveAxis: number;
  /** -1 (cần nâng) … 1 (cần hạ) */
  rodAxis: number;
  /** bấm để thả câu — đọc một lần rồi engine tự xóa */
  castPressed: boolean;
  /** giữ để kéo cần khi cá cắn */
  reelHeld: boolean;
}

export type HookState = "idle" | "dropping" | "water" | "biting" | "reeling";

interface Fish {
  x: number;
  y: number;
  vx: number;
  phase: number;
  flip: boolean;
  state: "swim" | "hooked" | "escaping";
  bite: number;
  jump: number;
  jumpDir: number;
  escT: number;
}

interface LotusBush {
  x: number;
  speed: number;
  seed: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const FISH_COUNT = 4;
const LOTUS_COUNT = 3;

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export class Engine {
  t = 0;
  elapsed = 0;
  boat = { x: 170, vx: 0, stun: 0, bob: 0, tilt: 0 };
  rod = { angle: 0 };
  hook = {
    state: "idle" as HookState,
    x: 0,
    y: 0,
    timer: 0,
    cooldown: 0,
    fish: null as Fish | null,
  };
  fishes: Fish[] = [];
  lotus: LotusBush[] = [];
  ripples: Ripple[] = [];
  drops: Drop[] = [];
  fishCaught = 0;
  collisions = 0;
  casts = 0;
  dockActive = false;
  won = false;
  events: GameEvent[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.t = 0;
    this.elapsed = 0;
    this.boat = { x: 170, vx: 0, stun: 0, bob: 0, tilt: 0 };
    this.rod = { angle: 0 };
    this.hook = { state: "idle", x: 0, y: 0, timer: 0, cooldown: 0, fish: null };
    this.ripples = [];
    this.drops = [];
    this.fishCaught = 0;
    this.collisions = 0;
    this.casts = 0;
    this.dockActive = false;
    this.won = false;
    this.events = [];

    const r = rand(20260729);
    this.fishes = [];
    for (let i = 0; i < FISH_COUNT; i++) this.spawnFish(r);
    this.lotus = [];
    for (let i = 0; i < LOTUS_COUNT; i++) {
      this.lotus.push({
        x: 260 + i * 240 + r() * 90,
        speed: (10 + r() * 14) * (r() > 0.5 ? 1 : -1),
        seed: 100 + i * 37,
      });
    }
  }

  private spawnFish(r: () => number = Math.random) {
    const dir = r() > 0.5 ? 1 : -1;
    this.fishes.push({
      x: 90 + r() * 780,
      y: WATER_Y + 40,
      vx: (26 + r() * 30) * dir,
      phase: r() * 10,
      flip: dir > 0,
      state: "swim",
      bite: 0,
      jump: 0,
      jumpDir: 1,
      escT: 0,
    });
  }

  rodTip() {
    return {
      x: this.boat.x + 44 + this.rod.angle * 34,
      y: WATER_Y - 52 + Math.abs(this.rod.angle) * 10 - this.boat.bob,
    };
  }

  private addRipple(x: number, y: number, r = 8) {
    this.ripples.push({ x, y, r, alpha: 0.45 });
  }

  private splash(x: number, y: number, n = 8) {
    this.addRipple(x, WATER_Y, 6);
    for (let i = 0; i < n; i++) {
      this.drops.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 130,
        vy: -90 - Math.random() * 130,
        life: 0.6 + Math.random() * 0.25,
      });
    }
  }

  private retract() {
    this.hook.state = "idle";
    this.hook.cooldown = 0.6;
    this.hook.fish = null;
  }

  /** skill 0–100: điều khiển khéo = ít va chạm, bắt nhanh */
  skillScore() {
    const base = 100 - this.collisions * 12 - Math.max(0, this.casts - 6) * 4;
    const timeBonus = Math.max(0, Math.round(45 - this.elapsed)) * 0.4;
    return Math.max(10, Math.min(100, Math.round(base + timeBonus)));
  }

  update(dt: number, input: InputState) {
    this.t += dt;
    if (!this.won) this.elapsed += dt;

    const cast = input.castPressed;
    input.castPressed = false;

    // ---- thuyền ----
    if (this.boat.stun > 0) this.boat.stun -= dt;
    const maxV = this.boat.stun > 0 ? 0 : 235;
    const target = input.moveAxis * maxV;
    this.boat.vx += (target - this.boat.vx) * Math.min(1, dt * 5);
    this.boat.x += this.boat.vx * dt;
    if (this.boat.x < BOAT_MIN_X) {
      this.boat.x = BOAT_MIN_X;
      this.boat.vx *= -0.3;
    }
    if (this.boat.x > BOAT_MAX_X) {
      this.boat.x = BOAT_MAX_X;
      this.boat.vx *= -0.3;
    }
    this.boat.bob = Math.sin(this.t * 2.3) * 3;
    this.boat.tilt = this.boat.vx * 0.0011;

    if (Math.abs(this.boat.vx) > 40 && Math.random() < dt * 9) {
      this.addRipple(this.boat.x - Math.sign(this.boat.vx) * 34, WATER_Y + 4, 7);
    }

    // ---- cần câu ----
    this.rod.angle += (input.rodAxis * 0.5 - this.rod.angle) * Math.min(1, dt * 7);
    if (this.hook.cooldown > 0) this.hook.cooldown -= dt;

    const tip = this.rodTip();

    switch (this.hook.state) {
      case "idle": {
        if (cast && this.hook.cooldown <= 0 && this.boat.stun <= 0) {
          this.casts++;
          this.hook.state = "dropping";
          this.hook.x = tip.x;
          this.hook.y = tip.y;
          this.hook.timer = 0;
        }
        break;
      }
      case "dropping": {
        this.hook.timer += dt;
        this.hook.x += (tip.x - this.hook.x) * Math.min(1, dt * 4);
        this.hook.y += (WATER_Y + 80 - this.hook.y) * Math.min(1, dt * 5);
        if (this.hook.y > WATER_Y + 72) {
          this.addRipple(this.hook.x, WATER_Y, 9);
          const f = this.fishes.find(
            (f) =>
              f.state === "swim" &&
              Math.abs(f.x - this.hook.x) < 55 &&
              f.y > WATER_Y + 14,
          );
          if (f) {
            f.state = "hooked";
            f.bite = 2.4;
            this.hook.state = "biting";
            this.hook.fish = f;
            this.events.push("bite");
          } else {
            this.hook.state = "water";
            this.hook.timer = 0;
          }
        }
        break;
      }
      case "water": {
        this.hook.timer += dt;
        this.hook.x += (tip.x - this.hook.x) * Math.min(1, dt * 3);
        this.hook.y = WATER_Y + 80 + Math.sin(this.t * 3) * 3;
        const f = this.fishes.find(
          (f) => f.state === "swim" && Math.abs(f.x - this.hook.x) < 46,
        );
        if (f) {
          f.state = "hooked";
          f.bite = 2.4;
          this.hook.state = "biting";
          this.hook.fish = f;
          this.events.push("bite");
        } else if (input.reelHeld || this.hook.timer > 2.2) {
          if (this.hook.timer <= 2.2) this.events.push("empty");
          this.retract();
        }
        break;
      }
      case "biting": {
        const f = this.hook.fish;
        this.hook.timer += dt;
        this.hook.x += (tip.x - this.hook.x) * Math.min(1, dt * 2);
        this.hook.y = WATER_Y + 80 + Math.sin(this.t * 9) * 5;
        if (f) {
          f.x += (this.hook.x - f.x) * Math.min(1, dt * 6);
          f.y += (this.hook.y - f.y) * Math.min(1, dt * 6);
          f.bite -= dt;
          if (input.reelHeld) {
            this.hook.state = "reeling";
          } else if (f.bite <= 0) {
            this.events.push("escape");
            f.state = "escaping";
            f.vx = (f.x < this.hook.x ? -1 : 1) * 300;
            f.escT = 0;
            this.splash(f.x, WATER_Y, 6);
            this.retract();
          }
        } else {
          this.retract();
        }
        break;
      }
      case "reeling": {
        const f = this.hook.fish;
        this.hook.y -= 155 * dt;
        this.hook.x += (tip.x - this.hook.x) * Math.min(1, dt * 4);
        if (f) {
          f.x += (this.hook.x - f.x) * Math.min(1, dt * 9);
          f.y += (this.hook.y - f.y) * Math.min(1, dt * 9);
        }
        // nhả giữa chừng → cá rơi lại, còn thời gian cắn lại
        if (!input.reelHeld && this.hook.y < WATER_Y + 45) {
          this.hook.state = "biting";
          if (this.hook.fish) this.hook.fish.bite = Math.max(this.hook.fish.bite, 1.4);
          break;
        }
        if (this.hook.y <= WATER_Y + 8) {
          if (f) {
            this.fishCaught++;
            this.events.push("catch");
            this.fishes = this.fishes.filter((x) => x !== f);
          }
          this.splash(this.hook.x, WATER_Y, 12);
          this.retract();
          if (this.fishCaught >= 3 && !this.dockActive) {
            this.dockActive = true;
            this.events.push("goal-dock");
          }
          if (this.fishes.length < FISH_COUNT && this.fishCaught < 3) this.spawnFish();
        }
        break;
      }
    }

    // ---- cá ----
    for (const f of this.fishes) {
      if (f.state === "swim") {
        f.phase += dt;
        f.x += f.vx * dt;
        if (f.x < 70) {
          f.x = 70;
          f.vx = Math.abs(f.vx);
          f.flip = true;
        }
        if (f.x > 890) {
          f.x = 890;
          f.vx = -Math.abs(f.vx);
          f.flip = false;
        }
        const baseY = WATER_Y + 42 + Math.sin(f.phase * 0.8) * 12;
        if (f.jump > 0) {
          const p = 1 - f.jump / 0.9;
          f.y = baseY - Math.sin(p * Math.PI) * 78;
          if (p < dt / 0.9 + 0.02) this.splash(f.x, WATER_Y, 6);
          if (f.jump - dt <= 0) this.splash(f.x, WATER_Y, 8);
          f.jump -= dt;
          if (f.jump <= 0) f.y = baseY;
        } else {
          f.y = baseY;
          if (Math.random() < dt * 0.07) f.jump = 0.9;
        }
        f.flip = f.vx > 0;
      } else if (f.state === "escaping") {
        f.escT += dt;
        f.x += f.vx * dt;
        f.y += 70 * dt;
        if (f.x < 60 || f.x > 900) f.vx *= -1;
        if (f.escT > 1.5) {
          f.state = "swim";
          f.vx = (Math.random() > 0.5 ? 1 : -1) * 34;
        }
      }
    }

    // ---- bụi sen ----
    for (const l of this.lotus) {
      l.x += l.speed * dt;
      if (l.x < -70) l.x = STAGE_W + 70;
      if (l.x > STAGE_W + 70) l.x = -70;

      if (
        this.boat.stun <= 0 &&
        Math.abs(this.boat.x - l.x) < 58 &&
        Math.abs(this.boat.vx) > 12
      ) {
        this.boat.stun = 1;
        this.collisions++;
        this.boat.vx = (this.boat.x < l.x ? -1 : 1) * 150;
        this.events.push("collide");
        this.splash(this.boat.x, WATER_Y, 8);
      }
    }

    // ---- bến ----
    if (this.dockActive && !this.won && this.boat.x > DOCK_X - 28) {
      this.won = true;
      this.boat.vx = 0;
      this.events.push("win");
    }

    // ---- hiệu ứng ----
    for (const r of this.ripples) {
      r.r += 62 * dt;
      r.alpha -= 0.4 * dt;
    }
    this.ripples = this.ripples.filter((r) => r.alpha > 0);
    for (const d of this.drops) {
      d.vy += 560 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
    }
    this.drops = this.drops.filter((d) => d.life > 0 && d.y < WATER_Y + 6);
  }
}
