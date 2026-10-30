import { describe, expect, it } from "vitest";
import { DragonEngine, WARN_TIME } from "../game/dragon/engine";
import { ARTIFACTS, LEFT_X, PANEL_Y, RIGHT_X, VerifyEngine } from "../game/verify/engine";
import { LANE_Y, MemoryEngine, PIECES } from "../game/memory/engine";

const still = { moveAxis: 0, sprayHeld: false };

describe("Rồng Phun Nước — FL-1", () => {
  it("tưới ướt nơi đang cảnh báo thì lửa không bén", () => {
    const e = new DragonEngine();
    e.nextWarn = 999;
    const s = e.sites[2]!;
    s.warn = WARN_TIME;
    e.dragon.x = s.x;
    for (let i = 0; i < 40; i++) e.update(1 / 60, { moveAxis: 0, sprayHeld: true });
    expect(s.warn).toBe(0);
    expect(s.fire).toBe(0);
    expect(e.prevented).toBe(1);
  });

  it("bỏ mặc cảnh báo thì lửa bén và làm hỏng công trình", () => {
    const e = new DragonEngine();
    e.nextWarn = 999;
    const s = e.sites[0]!;
    s.warn = 0.1;
    e.dragon.x = 800;
    for (let i = 0; i < 120; i++) e.update(1 / 60, still);
    expect(s.fire).toBeGreaterThan(0);
    expect(s.hp).toBeLessThan(100);
  });

  it("phun vào đám cháy thì dập tắt được", () => {
    const e = new DragonEngine();
    e.nextWarn = 999;
    const s = e.sites[1]!;
    s.fire = 0.5;
    e.dragon.x = s.x;
    for (let i = 0; i < 90; i++) e.update(1 / 60, { moveAxis: 0, sprayHeld: true });
    expect(s.fire).toBe(0);
    expect(e.events).toContain("extinguished");
  });

  it("hết giờ mà còn ≥3 công trình là thắng", () => {
    const e = new DragonEngine();
    e.nextWarn = 999;
    e.timeLeft = 0.01;
    e.update(1 / 60, still);
    expect(e.done).toBe(true);
    expect(e.won()).toBe(true);
  });
});

describe("Tễu Thẩm Định — FL-2", () => {
  const centre = (e: VerifyEngine, id: string, ox = RIGHT_X) => {
    const r = e.part(id)!.rect;
    return { x: ox + r.x + r.w / 2, y: PANEL_Y + r.y + r.h / 2 };
  };

  it("mỗi vòng có đúng 3 chỗ sai thuộc bức tranh hiện tại", () => {
    const e = new VerifyEngine(42);
    expect(e.distorted).toHaveLength(3);
    const ids = e.artifact().parts.map((p) => p.id);
    for (const d of e.distorted) expect(ids).toContain(d);
  });

  it("chạm đúng chỗ sai ở cả hai khung đều tính, chạm nhầm bị trừ", () => {
    const e = new VerifyEngine(7);
    const [a, b] = e.distorted;
    const pa = centre(e, a!);
    e.tap(pa.x, pa.y);
    const pb = centre(e, b!, LEFT_X);
    e.tap(pb.x, pb.y);
    expect(e.found).toEqual([a, b]);
    const clean = e.artifact().parts.find((p) => !e.distorted.includes(p.id));
    // một chỗ không bị sửa và không chồng lên chỗ sai nào
    if (clean) {
      const before = e.totalMisses;
      e.tap(5 + RIGHT_X, PANEL_Y + 5);
      expect(e.totalMisses).toBe(before + 1);
    }
  });

  it("tìm đủ cả ba bức thì kết thúc", () => {
    const e = new VerifyEngine(3);
    for (let r = 0; r < ARTIFACTS.length; r++) {
      for (const id of [...e.distorted]) {
        const p = centre(e, id);
        e.tap(p.x, p.y);
      }
      expect(e.cleared).toBe(true);
      e.nextRound();
    }
    expect(e.finished).toBe(true);
    expect(e.accuracy()).toBe(100);
  });

  it("hết giờ thì lộ chỗ sai nhưng không tính là người chơi tìm ra", () => {
    const e = new VerifyEngine(9);
    e.update(999);
    expect(e.cleared).toBe(true);
    expect(e.playerFound).toBe(0);
  });
});

describe("Ghép Mảnh Ký Ức — kiều bào", () => {
  const idle = () => ({ moveAxis: 0, switchPressed: false, laneTarget: -1 });

  it("thuyền vớt được mảnh ảnh trôi tới cùng luồng", () => {
    const e = new MemoryEngine();
    const l = e.spawn("piece", e.boat.lane, 4);
    l.x = e.boat.x + 10;
    e.update(1 / 60, idle());
    expect(e.collected[4]).toBe(true);
    expect(e.events).toContain("piece");
  });

  it("đổi luồng để né đèn ảnh giả", () => {
    const e = new MemoryEngine();
    e.update(1 / 60, { ...idle(), laneTarget: 0 });
    for (let i = 0; i < 40; i++) e.update(1 / 60, idle());
    expect(Math.abs(e.boat.y - LANE_Y[0])).toBeLessThan(3);
    const fake = e.spawn("fake", 1);
    fake.x = e.boat.x;
    e.update(1 / 60, idle());
    expect(e.trust).toBe(3);
  });

  it("vớt nhầm ảnh giả mất tin cậy và hỏng một mảnh", () => {
    const e = new MemoryEngine();
    e.collected[0] = true;
    const fake = e.spawn("fake", e.boat.lane);
    fake.x = e.boat.x;
    e.update(1 / 60, idle());
    expect(e.trust).toBe(2);
    expect(e.collected[0]).toBe(false);
  });

  it("đủ chín mảnh thì thắng", () => {
    const e = new MemoryEngine();
    e.collected = new Array<boolean>(PIECES).fill(true);
    e.collected[8] = false;
    const l = e.spawn("piece", e.boat.lane, 8);
    l.x = e.boat.x;
    e.update(1 / 60, idle());
    expect(e.won).toBe(true);
  });
});
