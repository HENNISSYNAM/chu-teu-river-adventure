// Vẽ tích trò "Ghép Mảnh Ký Ức"
import { STAGE_W, WATER_Y } from "../engine";
import { drawAudience, drawBackdrop, drawTeu, drawWaterSurface } from "../render";
import { LANE_Y, PIECES, type Lamp, type MemoryEngine } from "./engine";

const MOSAIC_X = 36;
const MOSAIC_Y = 58;
const MOSAIC = 150;
const CELL = MOSAIC / 3;

let picture: HTMLCanvasElement | null = null;

// Bức ảnh di sản cần ghép: chùa Một Cột giữa hồ sen (vẽ một lần ra canvas phụ)
function getPicture(): HTMLCanvasElement | null {
  if (picture) return picture;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = MOSAIC;
  c.height = MOSAIC;
  const g = c.getContext("2d");
  if (!g) return null;
  // trời chiều kiểu ảnh cũ ngả màu
  const sky = g.createLinearGradient(0, 0, 0, MOSAIC);
  sky.addColorStop(0, "#e8d3a2");
  sky.addColorStop(1, "#c9a66b");
  g.fillStyle = sky;
  g.fillRect(0, 0, MOSAIC, MOSAIC);
  // hồ
  g.fillStyle = "#6f8a7a";
  g.fillRect(0, 104, MOSAIC, 46);
  g.strokeStyle = "#8a6a3a";
  g.lineWidth = 3;
  g.strokeRect(14, 104, 122, 40);
  // cột đá
  g.fillStyle = "#7d6b55";
  g.fillRect(69, 82, 12, 34);
  // đế hoa sen
  g.fillStyle = "#5d3a1e";
  g.fillRect(48, 74, 54, 8);
  // gian thờ
  g.fillStyle = "#7a3a24";
  g.fillRect(52, 50, 46, 24);
  g.fillStyle = "#e7c27a";
  g.fillRect(68, 56, 14, 18);
  // mái cong
  g.beginPath();
  g.moveTo(36, 52);
  g.quadraticCurveTo(75, 22, 114, 52);
  g.lineTo(122, 40);
  g.lineTo(110, 56);
  g.lineTo(40, 56);
  g.lineTo(28, 40);
  g.closePath();
  g.fillStyle = "#5a2a1e";
  g.fill();
  // rồng trên nóc
  g.strokeStyle = "#5a2a1e";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(60, 34);
  g.quadraticCurveTo(75, 24, 90, 34);
  g.stroke();
  // lá sen
  g.fillStyle = "#4f6f4a";
  for (const [x, y] of [
    [26, 124],
    [118, 128],
    [40, 136],
  ] as const) {
    g.beginPath();
    g.ellipse(x, y, 11, 4, 0, 0, Math.PI * 2);
    g.fill();
  }
  // hạt ảnh cũ
  g.fillStyle = "rgba(60, 40, 20, 0.08)";
  for (let i = 0; i < 260; i++) {
    g.fillRect((i * 37) % MOSAIC, (i * 91) % MOSAIC, 1.5, 1.5);
  }
  picture = c;
  return c;
}

function drawMosaic(ctx: CanvasRenderingContext2D, e: MemoryEngine) {
  ctx.fillStyle = "#3b2410";
  ctx.fillRect(MOSAIC_X - 8, MOSAIC_Y - 8, MOSAIC + 16, MOSAIC + 34);
  ctx.strokeStyle = "#e9b64f";
  ctx.lineWidth = 2;
  ctx.strokeRect(MOSAIC_X - 8, MOSAIC_Y - 8, MOSAIC + 16, MOSAIC + 34);
  const pic = getPicture();
  for (let i = 0; i < PIECES; i++) {
    const cx = (i % 3) * CELL;
    const cy = Math.floor(i / 3) * CELL;
    if (e.collected[i] && pic) {
      ctx.drawImage(pic, cx, cy, CELL, CELL, MOSAIC_X + cx, MOSAIC_Y + cy, CELL, CELL);
    } else {
      ctx.fillStyle = "rgba(20, 30, 50, 0.85)";
      ctx.fillRect(MOSAIC_X + cx, MOSAIC_Y + cy, CELL, CELL);
      ctx.fillStyle = "rgba(246, 230, 176, 0.35)";
      ctx.font = "700 16px 'Baloo 2', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(i + 1), MOSAIC_X + cx + CELL / 2, MOSAIC_Y + cy + CELL / 2 + 6);
    }
    ctx.strokeStyle = "rgba(233, 182, 79, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(MOSAIC_X + cx, MOSAIC_Y + cy, CELL, CELL);
  }
  if (e.lastPiece >= 0 && e.collected[e.lastPiece]) {
    const i = e.lastPiece;
    const glow = 0.5 + 0.5 * Math.sin(e.t * 8);
    ctx.strokeStyle = `rgba(255, 220, 120, ${glow})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(
      MOSAIC_X + (i % 3) * CELL + 1,
      MOSAIC_Y + Math.floor(i / 3) * CELL + 1,
      CELL - 2,
      CELL - 2,
    );
  }
  ctx.fillStyle = "#f6e3ac";
  ctx.font = "600 12px 'Be Vietnam Pro', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `Chùa Một Cột ${e.count()}/${PIECES}`,
    MOSAIC_X + MOSAIC / 2,
    MOSAIC_Y + MOSAIC + 18,
  );
}

function drawLamp(ctx: CanvasRenderingContext2D, l: Lamp, t: number) {
  const y = LANE_Y[l.lane] + Math.sin(t * 2 + l.phase) * 3;
  const fake = l.kind === "fake";
  // quầng sáng
  const g = ctx.createRadialGradient(l.x, y - 10, 2, l.x, y - 10, 46);
  g.addColorStop(0, fake ? "rgba(150, 90, 255, 0.45)" : "rgba(255, 200, 100, 0.5)");
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(l.x - 46, y - 56, 92, 92);
  // đài sen
  ctx.fillStyle = "#2f7d4f";
  ctx.beginPath();
  ctx.ellipse(l.x, y + 4, 30, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let p = 0; p < 7; p++) {
    ctx.save();
    ctx.translate(l.x, y);
    ctx.rotate((p - 3) * 0.42);
    ctx.fillStyle = fake ? "#6b4fb3" : "#f2a7bb";
    ctx.beginPath();
    ctx.ellipse(0, -10, 6, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = fake ? "#3d2a75" : "#d97f9d";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
  // mảnh ảnh trên đèn
  const pic = getPicture();
  const s = 30;
  if (fake) {
    // ảnh giả: nhiễu sọc, lệch màu
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? "#ff4fd8" : "#4ff0ff";
      ctx.fillRect(l.x - s / 2 + Math.sin(t * 20 + i) * 2, y - 40 + i * 5, s, 5);
    }
    ctx.fillStyle = "#1a1030";
    ctx.font = "800 10px 'Be Vietnam Pro', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("AI", l.x, y - 22);
  } else if (pic) {
    const cx = (l.piece % 3) * CELL;
    const cy = Math.floor(l.piece / 3) * CELL;
    ctx.drawImage(pic, cx, cy, CELL, CELL, l.x - s / 2, y - 40, s, s);
    ctx.strokeStyle = "#e9b64f";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(l.x - s / 2, y - 40, s, s);
  }
  // nhãn nơi gửi
  ctx.font = "600 10px 'Be Vietnam Pro', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = fake ? "rgba(210, 190, 255, 0.85)" : "rgba(246, 230, 176, 0.85)";
  ctx.fillText(fake ? "nguồn không rõ" : `từ ${l.origin}`, l.x, y + 16);
}

function drawBoat(ctx: CanvasRenderingContext2D, e: MemoryEngine) {
  const { x, y, bob, vx } = e.boat;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(vx * 0.001);
  ctx.fillStyle = "rgba(6, 16, 28, 0.3)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 50, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-50, -6);
  ctx.quadraticCurveTo(0, 20, 50, -6);
  ctx.quadraticCurveTo(40, 6, 0, 9);
  ctx.quadraticCurveTo(-40, 6, -50, -6);
  ctx.closePath();
  ctx.fillStyle = "#8a2a22";
  ctx.fill();
  ctx.strokeStyle = "#e9b64f";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  drawTeu(ctx, x, y + bob - 2, e.t);
}

export function drawMemoryStage(ctx: CanvasRenderingContext2D, e: MemoryEngine) {
  const t = e.t;
  drawBackdrop(ctx, t, "GHÉP MẢNH KÝ ỨC", "MÚA RỐI NƯỚC – HOA ĐĂNG KIỀU BÀO · HERITRUST", {
    pavilion: false,
  });
  drawWaterSurface(ctx, t);

  // hai luồng nước
  for (const ly of LANE_Y) {
    ctx.strokeStyle = "rgba(190, 235, 235, 0.12)";
    ctx.setLineDash([14, 12]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, ly + 22);
    ctx.lineTo(STAGE_W, ly + 22);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawMosaic(ctx, e);

  // đèn ở luồng xa vẽ trước, rồi thuyền, rồi luồng gần
  for (const l of e.lamps) if (l.lane === 0) drawLamp(ctx, l, t);
  if (e.boat.lane === 0 || e.boat.y < (LANE_Y[0] + LANE_Y[1]) / 2) {
    drawBoat(ctx, e);
    for (const l of e.lamps) if (l.lane === 1) drawLamp(ctx, l, t);
  } else {
    for (const l of e.lamps) if (l.lane === 1) drawLamp(ctx, l, t);
    drawBoat(ctx, e);
  }

  // bến của người giữ gìn di sản bên phải khi đã đủ mảnh
  if (e.won) {
    ctx.fillStyle = "rgba(127, 209, 139, 0.9)";
    ctx.font = "800 22px 'Baloo 2', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✓ Người giữ gìn di sản đã ký duyệt bản ghi", STAGE_W / 2, WATER_Y - 30);
  }

  drawAudience(ctx);
}
