// Chế độ trình diễn: "nghệ nhân giật dây" tự điều khiển từng tích trò để người
// thuyết trình chỉ cần đứng nói, không phải vừa chơi vừa giải thích.
// Mỗi hàm chỉ đọc trạng thái engine và trả về đầu vào cho khung hình tiếp theo.

import { type DragonEngine, type DragonInput, SPRAY_REACH } from "../dragon/engine";
import { LANE_Y, type MemoryEngine, type MemoryInput } from "../memory/engine";
import { PANEL_Y, RIGHT_X, type VerifyEngine } from "../verify/engine";

function steer(from: number, to: number, deadZone = 8) {
  const d = to - from;
  if (Math.abs(d) < deadZone) return 0;
  return Math.max(-1, Math.min(1, d / 60));
}

/** Rồng: ưu tiên chặn nơi đang cảnh báo sắp cháy nhất, rồi tới đám cháy to nhất. */
export function dragonPilot(e: DragonEngine): DragonInput {
  const alive = e.sites.filter((s) => !s.lost);
  const warned = alive.filter((s) => s.warn > 0).sort((a, b) => a.warn - b.warn)[0];
  const burning = alive.filter((s) => s.fire > 0).sort((a, b) => b.fire - a.fire)[0];
  const target = warned ?? burning;
  if (!target) {
    // không có việc gì: về giữa ao, để nước đầy lại
    return { moveAxis: steer(e.dragon.x, 480, 30), sprayHeld: false };
  }
  const close = Math.abs(target.x - e.dragon.x) < SPRAY_REACH * 0.6;
  return {
    moveAxis: close ? 0 : steer(e.dragon.x, target.x),
    // giữ lại chút nước cho lần sau thay vì phun cạn bình
    sprayHeld: close && e.water > 0.05,
  };
}

export interface VerifyPilotState {
  wait: number;
}

/**
 * Thẩm định: cứ ~1,2 giây chỉ ra một chỗ sai (đủ chậm để khán giả kịp nhìn),
 * xong bức nào thì dừng 2 giây cho người thuyết trình nói về hai mã băm.
 */
export function verifyPilot(e: VerifyEngine, st: VerifyPilotState, dt: number) {
  st.wait -= dt;
  if (st.wait > 0 || e.finished) return;
  if (e.cleared) {
    e.nextRound();
    st.wait = 1.4;
    return;
  }
  const next = e.distorted.find((id) => !e.found.includes(id));
  const p = next ? e.part(next) : undefined;
  if (!p) return;
  e.tap(RIGHT_X + p.rect.x + p.rect.w / 2, PANEL_Y + p.rect.y + p.rect.h / 2);
  st.wait = e.cleared ? 2.2 : 1.2;
}

/** Hoa đăng: né đèn ảnh giả đang tới gần ở luồng của thuyền, đón mảnh còn thiếu gần nhất. */
export function memoryPilot(e: MemoryEngine): MemoryInput {
  const input: MemoryInput = { moveAxis: 0, switchPressed: false, laneTarget: -1 };
  const lane = e.boat.lane;
  const other = lane === 0 ? 1 : 0;

  const threat = e.lamps.find(
    (l) => l.kind === "fake" && l.lane === lane && l.x > e.boat.x - 30 && l.x - e.boat.x < 170,
  );
  if (threat) {
    const otherBlocked = e.lamps.some(
      (l) => l.kind === "fake" && l.lane === other && Math.abs(l.x - e.boat.x) < 90,
    );
    if (!otherBlocked) {
      input.laneTarget = other;
      return input;
    }
    // cả hai luồng đều có ảnh giả: lùi về phía sau để nó trôi qua
    input.moveAxis = -1;
    return input;
  }

  const wanted = e.lamps
    .filter((l) => l.kind === "piece" && !e.collected[l.piece] && l.x > 40)
    .sort((a, b) => Math.abs(a.x - e.boat.x) - Math.abs(b.x - e.boat.x))[0];
  if (wanted) {
    const laneClear = !e.lamps.some(
      (l) =>
        l.kind === "fake" &&
        l.lane === wanted.lane &&
        Math.abs(l.x - e.boat.x) < 120 &&
        Math.abs(LANE_Y[l.lane] - e.boat.y) > 1,
    );
    if (wanted.lane !== lane && laneClear) input.laneTarget = wanted.lane;
    // đón đầu: đèn trôi sang trái nên đứng hơi lệch về phía nó đang tới
    input.moveAxis = steer(e.boat.x, wanted.x - 30);
  } else {
    input.moveAxis = steer(e.boat.x, 360, 20);
  }
  return input;
}
