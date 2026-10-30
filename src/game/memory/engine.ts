// Tích trò "Ghép Mảnh Ký Ức" — logic thuần.
// Kiều bào khắp nơi gửi về những mảnh ảnh xưa theo hoa đăng trôi trên ao. Chú Tễu
// chèo thuyền giữa hai luồng nước, vớt đủ chín mảnh để ghép lại bức ảnh di sản,
// tránh những chiếc đèn mang ảnh giả do AI tạo. Đủ mảnh thì người giữ gìn ký duyệt.

import { STAGE_W, WATER_Y } from "../engine";

export const PIECES = 9;
export const LANE_Y = [WATER_Y + 46, WATER_Y + 124] as const;
export const BOAT_MIN_X = 70;
export const BOAT_MAX_X = STAGE_W - 70;
export const START_TRUST = 3;
const CATCH_DX = 44;

export const ORIGINS = [
  "Paris",
  "Sydney",
  "Houston",
  "Berlin",
  "Toronto",
  "Praha",
  "Tokyo",
  "Seoul",
  "Melbourne",
  "San Jose",
  "Warszawa",
  "Busan",
] as const;

export type MemoryEvent = "piece" | "dup" | "fake" | "lost-piece" | "win" | "fail";

export interface MemoryInput {
  /** -1 (trái) … 1 (phải) */
  moveAxis: number;
  /** bấm để đổi luồng — đọc một lần rồi engine tự xóa */
  switchPressed: boolean;
  /** chọn thẳng luồng 0 (xa) hoặc 1 (gần), -1 = không đổi */
  laneTarget: number;
}

export interface Lamp {
  id: number;
  x: number;
  lane: 0 | 1;
  speed: number;
  kind: "piece" | "fake";
  piece: number;
  origin: string;
  phase: number;
}

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export class MemoryEngine {
  t = 0;
  elapsed = 0;
  boat = { x: 200, vx: 0, lane: 1 as 0 | 1, y: LANE_Y[1] as number, bob: 0 };
  lamps: Lamp[] = [];
  collected: boolean[] = new Array<boolean>(PIECES).fill(false);
  /** mảnh vừa vớt được, để HUD nháy sáng */
  lastPiece = -1;
  lastOrigin = "";
  trust = START_TRUST;
  fakesDodged = 0;
  fakesCaught = 0;
  done = false;
  won = false;
  events: MemoryEvent[] = [];
  private nextSpawn = 0.6;
  private nextId = 1;
  private rnd = rand(1);

  constructor(seed = 20261030) {
    this.reset(seed);
  }

  reset(seed = 20261030) {
    this.rnd = rand(seed);
    this.t = 0;
    this.elapsed = 0;
    this.boat = { x: 200, vx: 0, lane: 1, y: LANE_Y[1], bob: 0 };
    this.lamps = [];
    this.collected = new Array<boolean>(PIECES).fill(false);
    this.lastPiece = -1;
    this.lastOrigin = "";
    this.trust = START_TRUST;
    this.fakesDodged = 0;
    this.fakesCaught = 0;
    this.done = false;
    this.won = false;
    this.events = [];
    this.nextSpawn = 0.6;
    this.nextId = 1;
  }

  count() {
    return this.collected.filter(Boolean).length;
  }

  /** Thả một chiếc đèn mới từ mép phải; cũng dùng trong kiểm thử. */
  spawn(kind?: "piece" | "fake", lane?: 0 | 1, piece?: number): Lamp {
    const missing = this.collected.flatMap((c, i) => (c ? [] : [i]));
    const isFake = kind ? kind === "fake" : this.rnd() < 0.3;
    const pick =
      piece ??
      (missing.length && this.rnd() < 0.75
        ? missing[Math.floor(this.rnd() * missing.length)]!
        : Math.floor(this.rnd() * PIECES));
    const lamp: Lamp = {
      id: this.nextId++,
      x: STAGE_W + 40,
      lane: lane ?? (this.rnd() < 0.5 ? 0 : 1),
      speed: 80 + this.rnd() * 60 + this.count() * 4,
      kind: isFake ? "fake" : "piece",
      piece: pick,
      origin: ORIGINS[Math.floor(this.rnd() * ORIGINS.length)]!,
      phase: this.rnd() * 6,
    };
    this.lamps.push(lamp);
    return lamp;
  }

  update(dt: number, input: MemoryInput) {
    this.t += dt;
    const sw = input.switchPressed;
    input.switchPressed = false;
    if (this.done) return;
    this.elapsed += dt;

    // ---- thuyền ----
    const target = input.moveAxis * 250;
    this.boat.vx += (target - this.boat.vx) * Math.min(1, dt * 6);
    this.boat.x = Math.max(BOAT_MIN_X, Math.min(BOAT_MAX_X, this.boat.x + this.boat.vx * dt));
    if (sw) this.boat.lane = this.boat.lane === 0 ? 1 : 0;
    if (input.laneTarget === 0 || input.laneTarget === 1) this.boat.lane = input.laneTarget;
    const ly = LANE_Y[this.boat.lane];
    this.boat.y += (ly - this.boat.y) * Math.min(1, dt * 9);
    this.boat.bob = Math.sin(this.t * 2.4) * 3;

    // ---- thả đèn ----
    this.nextSpawn -= dt;
    if (this.nextSpawn <= 0) {
      this.spawn();
      this.nextSpawn = 1.1 + this.rnd() * 1.1;
    }

    // ---- đèn trôi & vớt ----
    const keep: Lamp[] = [];
    for (const l of this.lamps) {
      l.x -= l.speed * dt;
      const inLane = Math.abs(this.boat.y - LANE_Y[l.lane]) < 22;
      if (inLane && Math.abs(l.x - this.boat.x) < CATCH_DX) {
        this.collect(l);
        continue;
      }
      if (l.x < -40) {
        if (l.kind === "fake") this.fakesDodged++;
        continue;
      }
      keep.push(l);
    }
    this.lamps = keep;

    if (this.count() === PIECES && !this.done) {
      this.done = true;
      this.won = true;
      this.events.push("win");
    } else if (this.trust <= 0 && !this.done) {
      this.done = true;
      this.events.push("fail");
    }
  }

  private collect(l: Lamp) {
    this.lastOrigin = l.origin;
    if (l.kind === "fake") {
      this.trust--;
      this.fakesCaught++;
      this.events.push("fake");
      // ảnh giả làm hỏng một mảnh đã ghép
      const have = this.collected.flatMap((c, i) => (c ? [i] : []));
      if (have.length) {
        const drop = have[Math.floor(this.rnd() * have.length)]!;
        this.collected[drop] = false;
        this.events.push("lost-piece");
      }
      return;
    }
    if (this.collected[l.piece]) {
      this.events.push("dup");
      return;
    }
    this.collected[l.piece] = true;
    this.lastPiece = l.piece;
    this.events.push("piece");
  }
}
