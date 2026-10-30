// Tích trò "Tễu Thẩm Định" — logic thuần.
// Bên trái là bản ghi gốc đã được người giữ gìn di sản ký duyệt (HeriID),
// bên phải là ảnh đang lan truyền trên mạng do AI vẽ lại. Mô hình FL-2 nghi ngờ
// ảnh bị làm sai lệch; người chơi chỉ ra đúng những chỗ sai để xác nhận.

export const PANEL_W = 400;
export const PANEL_H = 340;
export const LEFT_X = 50;
export const RIGHT_X = 510;
export const PANEL_Y = 140;
export const ROUND_TIME = 50;
export const DIFFS_PER_ROUND = 3;
const HIT_PAD = 10;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Part {
  id: string;
  /** điều AI đã vẽ sai, hiện ra khi tìm thấy */
  label: string;
  rect: Rect;
}

export interface HeritageArtifact {
  id: string;
  name: string;
  code: string;
  custodian: string;
  parts: Part[];
}

export const ARTIFACTS: HeritageArtifact[] = [
  {
    id: "thuy-dinh",
    name: "Thủy đình rối nước",
    code: "TD",
    custodian: "Ban quản lý di tích chùa Thầy (mô phỏng)",
    parts: [
      { id: "roof3", label: "Mái bị vẽ thêm một tầng", rect: { x: 130, y: 20, w: 140, h: 50 } },
      { id: "flag", label: "Cờ đuôi nheo đổi sang màu xanh", rect: { x: 30, y: 40, w: 60, h: 70 } },
      { id: "windows", label: "Thêm một ô cửa sổ", rect: { x: 90, y: 150, w: 220, h: 50 } },
      { id: "stilts", label: "Thừa một cột chống", rect: { x: 80, y: 220, w: 240, h: 70 } },
      {
        id: "pearl",
        label: "Mất hạt ngọc giữa đôi rồng trên nóc",
        rect: { x: 170, y: 70, w: 60, h: 40 },
      },
      { id: "lotus", label: "Hoa sen đổi sang màu trắng", rect: { x: 300, y: 270, w: 90, h: 60 } },
    ],
  },
  {
    id: "chu-teu",
    name: "Con rối chú Tễu",
    code: "TEU",
    custodian: "Nhà hát Múa rối Thăng Long (mô phỏng)",
    parts: [
      { id: "hair", label: "Ba chỏm tóc thay vì một", rect: { x: 165, y: 20, w: 70, h: 40 } },
      { id: "eyes", label: "Mắt mở tròn thay vì cười híp", rect: { x: 160, y: 70, w: 80, h: 30 } },
      { id: "mouth", label: "Miệng há tròn, mất nụ cười", rect: { x: 170, y: 100, w: 60, h: 34 } },
      { id: "sash", label: "Dải yếm đổi sang màu xanh", rect: { x: 140, y: 170, w: 120, h: 30 } },
      {
        id: "arm",
        label: "Tay phải buông xuống, không vẫy",
        rect: { x: 250, y: 120, w: 90, h: 90 },
      },
      {
        id: "base",
        label: "Mất bệ gỗ điều khiển dưới nước",
        rect: { x: 150, y: 280, w: 100, h: 50 },
      },
    ],
  },
  {
    id: "khue-van-cac",
    name: "Khuê Văn Các",
    code: "KVC",
    custodian: "Trung tâm Hoạt động Văn hóa Khoa học Văn Miếu (mô phỏng)",
    parts: [
      { id: "window", label: "Cửa sổ tròn thành cửa vuông", rect: { x: 160, y: 95, w: 80, h: 80 } },
      { id: "roofTop", label: "Mái trên mất đầu đao cong", rect: { x: 50, y: 30, w: 300, h: 65 } },
      { id: "pillars", label: "Thiếu một trụ gạch", rect: { x: 70, y: 210, w: 260, h: 70 } },
      { id: "railing", label: "Lan can gỗ đổi màu", rect: { x: 100, y: 175, w: 200, h: 30 } },
      {
        id: "pond",
        label: "Giếng Thiên Quang thành giếng tròn",
        rect: { x: 120, y: 290, w: 160, h: 45 },
      },
      { id: "plaque", label: "Biển đề đổi sang màu đỏ", rect: { x: 165, y: 72, w: 70, h: 22 } },
    ],
  },
];

export type VerifyEvent = "found" | "miss" | "hint" | "round-clear" | "timeout" | "finish";

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function contains(r: Rect, x: number, y: number, pad = 0) {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}

export interface Mark {
  x: number;
  y: number;
  ok: boolean;
  age: number;
}

export class VerifyEngine {
  round = 0;
  distorted: string[] = [];
  found: string[] = [];
  misses = 0;
  totalMisses = 0;
  /** số chỗ sai người chơi tự tìm ra (không tính chỗ lộ ra khi hết giờ) */
  playerFound = 0;
  hintsUsed = 0;
  hintPart: string | null = null;
  timeLeft = ROUND_TIME;
  score = 0;
  marks: Mark[] = [];
  /** đã xong vòng hiện tại, chờ sang vòng sau */
  cleared = false;
  finished = false;
  t = 0;
  events: VerifyEvent[] = [];
  private rnd = rand(1);

  constructor(seed = 20260608) {
    this.reset(seed);
  }

  reset(seed = 20260608) {
    this.rnd = rand(seed);
    this.round = 0;
    this.totalMisses = 0;
    this.playerFound = 0;
    this.hintsUsed = 0;
    this.score = 0;
    this.finished = false;
    this.t = 0;
    this.events = [];
    this.startRound();
  }

  artifact(): HeritageArtifact {
    return ARTIFACTS[this.round] ?? ARTIFACTS[0]!;
  }

  private startRound() {
    const ids = this.artifact().parts.map((p) => p.id);
    // xáo trộn Fisher–Yates rồi lấy 3 chỗ sai
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(this.rnd() * (i + 1));
      [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    }
    this.distorted = ids.slice(0, DIFFS_PER_ROUND);
    this.found = [];
    this.misses = 0;
    this.hintPart = null;
    this.timeLeft = ROUND_TIME;
    this.marks = [];
    this.cleared = false;
  }

  nextRound() {
    if (!this.cleared || this.finished) return;
    if (this.round >= ARTIFACTS.length - 1) {
      this.finished = true;
      this.events.push("finish");
      return;
    }
    this.round++;
    this.startRound();
  }

  /** Trạng thái các chi tiết của ảnh lan truyền (true = bị AI vẽ sai). */
  flags(): Set<string> {
    return new Set(this.distorted);
  }

  part(id: string) {
    return this.artifact().parts.find((p) => p.id === id);
  }

  /**
   * Bấm vào ảnh: (x, y) theo toạ độ sân khấu. Chấp nhận bấm vào cả hai khung,
   * vì chỗ sai nằm cùng vị trí ở bản gốc và ảnh lan truyền.
   */
  tap(x: number, y: number) {
    if (this.cleared || this.finished) return;
    let lx: number;
    if (x >= RIGHT_X && x <= RIGHT_X + PANEL_W) lx = x - RIGHT_X;
    else if (x >= LEFT_X && x <= LEFT_X + PANEL_W) lx = x - LEFT_X;
    else return;
    const ly = y - PANEL_Y;
    if (ly < 0 || ly > PANEL_H) return;

    const hit = this.distorted
      .filter((id) => !this.found.includes(id))
      .map((id) => this.part(id)!)
      .filter((p) => contains(p.rect, lx, ly, HIT_PAD))
      // vùng lồng nhau (biển đề nằm trên mái): ưu tiên vùng nhỏ hơn
      .sort((a, b) => a.rect.w * a.rect.h - b.rect.w * b.rect.h)[0];
    if (hit) {
      this.found.push(hit.id);
      this.playerFound++;
      if (this.hintPart === hit.id) this.hintPart = null;
      this.score += 100;
      this.marks.push({ x: lx, y: ly, ok: true, age: 0 });
      this.events.push("found");
      if (this.found.length === this.distorted.length) {
        this.score += Math.round(this.timeLeft * 2);
        this.cleared = true;
        this.events.push("round-clear");
      }
    } else {
      this.misses++;
      this.totalMisses++;
      this.score = Math.max(0, this.score - 20);
      this.marks.push({ x: lx, y: ly, ok: false, age: 0 });
      this.events.push("miss");
    }
  }

  hint() {
    if (this.cleared || this.finished || this.hintPart) return;
    const left = this.distorted.find((id) => !this.found.includes(id));
    if (!left) return;
    this.hintPart = left;
    this.hintsUsed++;
    this.score = Math.max(0, this.score - 30);
    this.events.push("hint");
  }

  /** Độ chính xác thẩm định 0–100 trên cả ba vòng. */
  accuracy() {
    const total = ARTIFACTS.length * DIFFS_PER_ROUND;
    const raw = (100 * this.playerFound) / total - this.totalMisses * 3 - this.hintsUsed * 5;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  update(dt: number) {
    this.t += dt;
    for (const m of this.marks) m.age += dt;
    this.marks = this.marks.filter((m) => m.ok || m.age < 0.9);
    if (this.cleared || this.finished) return;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.timeLeft <= 0) {
      // hết giờ: lộ các chỗ còn lại, vẫn cho sang vòng sau nhưng không có điểm
      this.found = [...this.distorted];
      this.cleared = true;
      this.events.push("timeout");
    }
  }
}
