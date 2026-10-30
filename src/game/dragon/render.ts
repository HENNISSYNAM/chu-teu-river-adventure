// Vẽ tích trò "Rồng Phun Nước Giữ Đình"
import { STAGE_W, WATER_Y } from "../engine";
import { drawAudience, drawBackdrop, drawWaterSurface } from "../render";
import { SPRAY_REACH, type DragonEngine, type Site } from "./engine";

const BANK_Y = WATER_Y - 4;
const DRAGON_Y = WATER_Y + 92;

function roofCurve(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  h: number,
  fill: string,
) {
  ctx.beginPath();
  ctx.moveTo(cx - w, y);
  ctx.quadraticCurveTo(cx - w * 0.5, y - h * 0.9, cx, y - h);
  ctx.quadraticCurveTo(cx + w * 0.5, y - h * 0.9, cx + w, y);
  ctx.quadraticCurveTo(cx + w * 1.12, y + 3, cx + w * 1.28, y - h * 0.45);
  ctx.lineTo(cx + w * 0.86, y + 5);
  ctx.lineTo(cx - w * 0.86, y + 5);
  ctx.quadraticCurveTo(cx - w * 1.12, y + 3, cx - w * 1.28, y - h * 0.45);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "#e9b64f";
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

function drawSiteShape(ctx: CanvasRenderingContext2D, s: Site) {
  const x = s.x;
  const y = BANK_Y;
  const scorch = 1 - s.hp / 100;
  const wall = `rgb(${Math.round(120 - scorch * 70)}, ${Math.round(78 - scorch * 50)}, ${Math.round(44 - scorch * 26)})`;
  const roof = `rgb(${Math.round(170 - scorch * 110)}, ${Math.round(52 - scorch * 30)}, ${Math.round(44 - scorch * 26)})`;
  ctx.fillStyle = wall;
  switch (s.kind) {
    case "dinh":
      ctx.fillRect(x - 46, y - 40, 92, 40);
      roofCurve(ctx, x, y - 40, 58, 30, roof);
      ctx.fillStyle = "rgba(255, 196, 92, 0.7)";
      ctx.fillRect(x - 10, y - 30, 20, 30);
      break;
    case "chua":
      ctx.fillRect(x - 40, y - 34, 80, 34);
      roofCurve(ctx, x, y - 34, 50, 22, roof);
      ctx.fillStyle = wall;
      ctx.fillRect(x - 24, y - 70, 48, 18);
      roofCurve(ctx, x, y - 70, 34, 20, roof);
      break;
    case "thap":
      for (let i = 0; i < 4; i++) {
        const w = 22 - i * 4;
        const yy = y - i * 26;
        ctx.fillStyle = wall;
        ctx.fillRect(x - w, yy - 20, w * 2, 20);
        roofCurve(ctx, x, yy - 20, w + 8, 9, roof);
      }
      break;
    case "nha":
      ctx.fillRect(x - 50, y - 32, 100, 32);
      roofCurve(ctx, x, y - 32, 60, 28, roof);
      ctx.fillStyle = "rgba(255, 196, 92, 0.55)";
      [-30, 0, 30].forEach((dx) => ctx.fillRect(x + dx - 7, y - 26, 14, 16));
      break;
    case "cong":
      ctx.fillRect(x - 46, y - 38, 18, 38);
      ctx.fillRect(x + 28, y - 38, 18, 38);
      ctx.fillRect(x - 16, y - 50, 32, 50);
      roofCurve(ctx, x - 37, y - 38, 18, 12, roof);
      roofCurve(ctx, x + 37, y - 38, 18, 12, roof);
      roofCurve(ctx, x, y - 50, 28, 18, roof);
      ctx.fillStyle = "#1d130a";
      ctx.beginPath();
      ctx.arc(x, y - 18, 9, Math.PI, 0);
      ctx.lineTo(x + 9, y);
      ctx.lineTo(x - 9, y);
      ctx.fill();
      break;
  }
}

function drawRuins(ctx: CanvasRenderingContext2D, s: Site, t: number) {
  ctx.fillStyle = "#2a1d14";
  ctx.beginPath();
  ctx.moveTo(s.x - 44, BANK_Y);
  ctx.lineTo(s.x - 30, BANK_Y - 14);
  ctx.lineTo(s.x - 8, BANK_Y - 8);
  ctx.lineTo(s.x + 12, BANK_Y - 18);
  ctx.lineTo(s.x + 40, BANK_Y);
  ctx.closePath();
  ctx.fill();
  // khói tàn
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.4 + i / 3) % 1;
    ctx.fillStyle = `rgba(120, 120, 130, ${0.35 * (1 - p)})`;
    ctx.beginPath();
    ctx.arc(s.x + Math.sin(t + i) * 8, BANK_Y - 20 - p * 70, 8 + p * 14, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlames(ctx: CanvasRenderingContext2D, s: Site, t: number) {
  const n = 3 + Math.round(s.fire * 4);
  for (let i = 0; i < n; i++) {
    const fx = s.x - 36 + (72 * i) / Math.max(1, n - 1);
    const h = (26 + s.fire * 46) * (0.75 + 0.25 * Math.sin(t * 9 + i * 1.7));
    const base = BANK_Y - 30;
    const g = ctx.createLinearGradient(fx, base, fx, base - h);
    g.addColorStop(0, "rgba(255, 120, 30, 0.95)");
    g.addColorStop(0.6, "rgba(255, 200, 60, 0.85)");
    g.addColorStop(1, "rgba(255, 240, 160, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(fx - 10, base);
    ctx.quadraticCurveTo(fx - 12, base - h * 0.5, fx, base - h);
    ctx.quadraticCurveTo(fx + 12, base - h * 0.5, fx + 10, base);
    ctx.closePath();
    ctx.fill();
  }
  const glow = ctx.createRadialGradient(s.x, BANK_Y - 40, 4, s.x, BANK_Y - 40, 110);
  glow.addColorStop(0, `rgba(255, 140, 40, ${0.35 * s.fire})`);
  glow.addColorStop(1, "rgba(255, 140, 40, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(s.x - 110, BANK_Y - 150, 220, 220);
}

function drawWarning(ctx: CanvasRenderingContext2D, s: Site, t: number) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 10);
  ctx.strokeStyle = `rgba(255, 196, 60, ${0.5 + pulse * 0.5})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.ellipse(s.x, BANK_Y - 40, 70, 58, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // bảng cảnh báo FL-1
  ctx.fillStyle = "rgba(40, 24, 8, 0.9)";
  ctx.fillRect(s.x - 50, BANK_Y - 132, 100, 22);
  ctx.strokeStyle = "#f2c46b";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(s.x - 50, BANK_Y - 132, 100, 22);
  ctx.fillStyle = "#f2c46b";
  ctx.font = "700 12px 'Be Vietnam Pro', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`⚠ FL-1 · ${Math.round(s.risk * 100)}%`, s.x, BANK_Y - 116);
}

function drawLabel(ctx: CanvasRenderingContext2D, s: Site) {
  ctx.font = "600 12px 'Be Vietnam Pro', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = s.lost ? "rgba(200, 200, 200, 0.6)" : "rgba(246, 230, 176, 0.9)";
  ctx.fillText(s.lost ? `${s.name} · đã mất` : s.name, s.x, BANK_Y + 18);
  if (!s.lost) {
    ctx.fillStyle = "rgba(10, 16, 30, 0.7)";
    ctx.fillRect(s.x - 30, BANK_Y + 24, 60, 5);
    ctx.fillStyle = s.hp > 60 ? "#7fd18b" : s.hp > 30 ? "#f2c46b" : "#ef6b5b";
    ctx.fillRect(s.x - 30, BANK_Y + 24, 60 * (s.hp / 100), 5);
  }
}

// Rồng rối nước: thân uốn sóng, vảy vàng, đầu ngẩng phun nước
function drawDragon(ctx: CanvasRenderingContext2D, e: DragonEngine) {
  const { x, bob, vx } = e.dragon;
  const dir = vx < -5 ? -1 : 1;
  const y = DRAGON_Y + bob;
  const t = e.t;

  // bóng dưới nước
  ctx.fillStyle = "rgba(6, 16, 28, 0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y + 22, 74, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  // các khúc thân nhô lên khỏi mặt nước
  for (let i = 4; i >= 0; i--) {
    const sx = -70 + i * 22;
    const sy = Math.sin(t * 4 - i * 0.9) * 6 - 6;
    ctx.fillStyle = i % 2 ? "#2f8a5a" : "#3fa36b";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 15, 12, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = "#e9b64f";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // vây lưng
    ctx.fillStyle = "#c22f26";
    ctx.beginPath();
    ctx.moveTo(sx - 6, sy - 11);
    ctx.lineTo(sx, sy - 20);
    ctx.lineTo(sx + 6, sy - 11);
    ctx.fill();
  }
  // cổ + đầu
  ctx.strokeStyle = "#3fa36b";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(38, -4);
  ctx.quadraticCurveTo(52, -22, 48, -38);
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.fillStyle = "#3fa36b";
  ctx.beginPath();
  ctx.ellipse(56, -44, 18, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e9b64f";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // sừng + râu
  ctx.strokeStyle = "#e9b64f";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(48, -54);
  ctx.lineTo(40, -68);
  ctx.moveTo(56, -55);
  ctx.lineTo(54, -70);
  ctx.stroke();
  ctx.strokeStyle = "#f6d67c";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(70, -40);
  ctx.quadraticCurveTo(84, -34 + Math.sin(t * 6) * 4, 92, -40);
  ctx.stroke();
  // mắt
  ctx.fillStyle = "#fff6d8";
  ctx.beginPath();
  ctx.arc(58, -48, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1d130a";
  ctx.beginPath();
  ctx.arc(59, -48, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpray(ctx: CanvasRenderingContext2D, e: DragonEngine) {
  if (!e.dragon.spraying) return;
  const dir = e.dragon.vx < -5 ? -1 : 1;
  const hx = e.dragon.x + dir * 70;
  const hy = DRAGON_Y + e.dragon.bob - 48;
  const s = e.target();
  const tx = s ? s.x : e.dragon.x + dir * SPRAY_REACH;
  const ty = s ? BANK_Y - 50 : WATER_Y - 30;
  const cx = (hx + tx) / 2;
  const cy = Math.min(hy, ty) - 70;
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = `rgba(170, 225, 240, ${0.55 - k * 0.15})`;
    ctx.lineWidth = 7 - k * 2;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.quadraticCurveTo(cx + k * 6, cy + k * 4, tx + (k - 1) * 8, ty);
    ctx.stroke();
  }
  // giọt bắn
  ctx.fillStyle = "rgba(220, 245, 250, 0.9)";
  for (let i = 0; i < 8; i++) {
    const p = (e.t * 2.4 + i / 8) % 1;
    const bx = (1 - p) * (1 - p) * hx + 2 * (1 - p) * p * cx + p * p * tx;
    const by = (1 - p) * (1 - p) * hy + 2 * (1 - p) * p * cy + p * p * ty;
    ctx.beginPath();
    ctx.arc(bx, by, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawDragonStage(ctx: CanvasRenderingContext2D, e: DragonEngine) {
  const t = e.t;
  drawBackdrop(ctx, t, "RỒNG PHUN NƯỚC GIỮ ĐÌNH", "MÚA RỐI NƯỚC – TÍCH MÚA RỒNG · HERITRUST FL-1", {
    pavilion: false,
  });
  // bờ đất bên kia ao
  ctx.fillStyle = "#1b2a24";
  ctx.fillRect(0, BANK_Y - 2, STAGE_W, 8);

  for (const s of e.sites) {
    if (s.lost) drawRuins(ctx, s, t);
    else drawSiteShape(ctx, s);
  }
  for (const s of e.sites) {
    if (s.fire > 0) drawFlames(ctx, s, t);
    if (s.warn > 0) drawWarning(ctx, s, t);
    if (s.wet > 0.05 && !s.lost) {
      // vệt nước nhỏ giọt trên mái khi công trình còn ướt
      ctx.strokeStyle = `rgba(170, 225, 240, ${0.25 + s.wet * 0.5})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const dx = -36 + i * 14;
        const p = (t * 1.5 + i * 0.37) % 1;
        ctx.beginPath();
        ctx.moveTo(s.x + dx, BANK_Y - 44 + p * 30);
        ctx.lineTo(s.x + dx, BANK_Y - 38 + p * 30);
        ctx.stroke();
      }
    }
  }

  drawWaterSurface(ctx, t);
  for (const s of e.sites) drawLabel(ctx, s);

  // tàn lửa
  for (const p of e.sparks) {
    ctx.fillStyle = `rgba(255, 190, 80, ${Math.min(1, p.life * 1.8)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSpray(ctx, e);
  drawDragon(ctx, e);
  drawAudience(ctx);
}
