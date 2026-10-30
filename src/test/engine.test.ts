import { describe, expect, it } from "vitest";
import { Engine, WATER_Y, DOCK_X, type InputState } from "../game/engine";

function input(partial: Partial<InputState> = {}): InputState {
  return { moveAxis: 0, rodAxis: 0, castPressed: false, reelHeld: false, ...partial };
}

describe("Engine — màn thả câu bắt cá", () => {
  it("chèo thuyền sang trái theo điều khiển", () => {
    const e = new Engine();
    const x0 = e.boat.x;
    for (let i = 0; i < 60; i++) e.update(1 / 60, input({ moveAxis: -1 }));
    expect(e.boat.x).toBeLessThan(x0 - 60);
  });

  it("thả câu gần cá → cá cắn → giữ kéo → bắt được cá", () => {
    const e = new Engine();
    const fish = e.fishes[0]!;
    // đặt cá ngay dưới điểm thả câu
    e.boat.x = 400;
    e.rod.angle = 0;
    const tip = e.rodTip();
    fish.x = tip.x + 10;
    fish.y = WATER_Y + 60;
    fish.vx = 0;
    fish.state = "swim";

    e.update(1 / 60, input({ castPressed: true }));
    expect(e.hook.state).toBe("dropping");
    for (let i = 0; i < 90; i++) e.update(1 / 60, input());
    expect(e.hook.state).toBe("biting");
    expect(e.events).toContain("bite");

    // giữ kéo cho cá nổi lên mặt nước
    for (let i = 0; i < 120; i++) e.update(1 / 60, input({ reelHeld: true }));
    expect(e.fishCaught).toBe(1);
  });

  it("không kéo khi cá cắn → cá vùng thoát", () => {
    const e = new Engine();
    const fish = e.fishes[0]!;
    e.boat.x = 400;
    fish.x = e.rodTip().x + 5;
    fish.y = WATER_Y + 60;
    fish.vx = 0;
    e.update(1 / 60, input({ castPressed: true }));
    for (let i = 0; i < 90; i++) e.update(1 / 60, input());
    expect(e.hook.state).toBe("biting");
    for (let i = 0; i < 200; i++) e.update(1 / 60, input());
    expect(e.events).toContain("escape");
    expect(e.fishCaught).toBe(0);
  });

  it("bắt đủ 3 con → mở bến → thuyền về bến là thắng", () => {
    const e = new Engine();
    for (let n = 0; n < 3; n++) {
      const fish = e.fishes[0]!;
      e.boat.x = 400;
      fish.x = e.rodTip().x + 5;
      fish.y = WATER_Y + 60;
      fish.vx = 0;
      fish.state = "swim";
      e.update(1 / 60, input({ castPressed: true }));
      for (let i = 0; i < 90; i++) e.update(1 / 60, input());
      for (let i = 0; i < 150; i++) e.update(1 / 60, input({ reelHeld: true }));
    }
    expect(e.fishCaught).toBe(3);
    expect(e.dockActive).toBe(true);
    expect(e.events).toContain("goal-dock");

    e.events.length = 0;
    e.boat.x = DOCK_X - 40;
    for (let i = 0; i < 90; i++) e.update(1 / 60, input({ moveAxis: 1 }));
    expect(e.won).toBe(true);
    expect(e.events).toContain("win");
  });

  it("va vào bụi sen bị chững lại và tính va chạm", () => {
    const e = new Engine();
    const l = e.lotus[0]!;
    l.x = 500;
    l.speed = 0;
    e.boat.x = 420;
    for (let i = 0; i < 120; i++) e.update(1 / 60, input({ moveAxis: 1 }));
    expect(e.collisions).toBeGreaterThan(0);
    expect(e.events).toContain("collide");
  });

  it("điểm khéo léo giảm khi hay va chạm", () => {
    const clean = new Engine();
    const clumsy = new Engine();
    clumsy.collisions = 4;
    expect(clumsy.skillScore()).toBeLessThan(clean.skillScore());
  });
});
