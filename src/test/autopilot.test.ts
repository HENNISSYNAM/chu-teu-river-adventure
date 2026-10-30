import { describe, expect, it } from "vitest";
import { DragonEngine } from "../game/dragon/engine";
import { VerifyEngine } from "../game/verify/engine";
import { MemoryEngine } from "../game/memory/engine";
import { dragonPilot, memoryPilot, verifyPilot } from "../game/demo/autopilot";

const DT = 1 / 30;

describe("Chế độ trình diễn — tự điều khiển", () => {
  it("rồng tự chơi giữ được ít nhất 3 công trình qua hết 75 giây", () => {
    for (const seed of [20260325, 1, 42]) {
      const e = new DragonEngine(seed);
      for (let i = 0; i < 30 * 80 && !e.done; i++) e.update(DT, dragonPilot(e));
      expect(e.done).toBe(true);
      expect(e.won()).toBe(true);
      expect(e.prevented).toBeGreaterThan(0);
    }
  });

  it("thẩm định tự chỉ đủ chỗ sai cả ba bức, không chạm nhầm", () => {
    const e = new VerifyEngine(20260608);
    const st = { wait: 0.5 };
    for (let i = 0; i < 30 * 40 && !e.finished; i++) {
      verifyPilot(e, st, DT);
      e.update(DT);
    }
    expect(e.finished).toBe(true);
    expect(e.totalMisses).toBe(0);
    expect(e.accuracy()).toBe(100);
  });

  it("thuyền hoa đăng tự ghép đủ 9 mảnh trong khoảng hai phút", () => {
    for (const seed of [20261030, 7, 99]) {
      const e = new MemoryEngine(seed);
      for (let i = 0; i < 30 * 120 && !e.done; i++) e.update(DT, memoryPilot(e));
      expect(e.won).toBe(true);
    }
  });
});
