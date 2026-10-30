// Vẽ tích trò "Tễu Thẩm Định": hai bức tranh — bản ghi gốc và ảnh lan truyền
import { drawBackdrop, drawWaterSurface, drawAudience } from "../render";
import { LEFT_X, PANEL_H, PANEL_W, PANEL_Y, RIGHT_X, type VerifyEngine } from "./engine";

const GOLD = "#e9b64f";
const RED = "#b23730";
const RED_DEEP = "#7e211d";
const WOOD = "#5d3a1e";
const AI_BLUE = "#3b6fd1";

function eaveRoof(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  h: number,
  upturn = true,
) {
  ctx.beginPath();
  ctx.moveTo(cx - w, y);
  ctx.quadraticCurveTo(cx - w * 0.55, y - h * 0.9, cx, y - h);
  ctx.quadraticCurveTo(cx + w * 0.55, y - h * 0.9, cx + w, y);
  if (upturn) {
    ctx.quadraticCurveTo(cx + w * 1.12, y + 4, cx + w * 1.28, y - h * 0.45);
    ctx.lineTo(cx + w * 0.86, y + 6);
    ctx.lineTo(cx - w * 0.86, y + 6);
    ctx.quadraticCurveTo(cx - w * 1.12, y + 4, cx - w * 1.28, y - h * 0.45);
  } else {
    ctx.lineTo(cx + w * 1.15, y + 6);
    ctx.lineTo(cx - w * 1.15, y + 6);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(cx, y - h, cx, y + 6);
  g.addColorStop(0, RED);
  g.addColorStop(1, RED_DEEP);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function pondBand(ctx: CanvasRenderingContext2D, y: number) {
  const g = ctx.createLinearGradient(0, y, 0, PANEL_H);
  g.addColorStop(0, "#2b6a7a");
  g.addColorStop(1, "#173f50");
  ctx.fillStyle = g;
  ctx.fillRect(0, y, PANEL_W, PANEL_H - y);
  ctx.strokeStyle = "rgba(200, 240, 240, 0.25)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(30 + i * 80, y + 14 + (i % 2) * 12);
    ctx.lineTo(70 + i * 80, y + 14 + (i % 2) * 12);
    ctx.stroke();
  }
}

function lotus(ctx: CanvasRenderingContext2D, x: number, y: number, white: boolean) {
  ctx.fillStyle = "#2f7d4f";
  ctx.beginPath();
  ctx.ellipse(x - 14, y + 10, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let p = 0; p < 6; p++) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2 + (p - 2.5) * 0.45);
    ctx.fillStyle = white ? "#f4f1ea" : "#f2a7bb";
    ctx.beginPath();
    ctx.ellipse(0, -9, 4.5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(x, y - 4, 3.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawThuyDinh(ctx: CanvasRenderingContext2D, f: Set<string>) {
  pondBand(ctx, 250);
  // cột chống
  ctx.fillStyle = "#4a2f18";
  const stilts = f.has("stilts") ? [110, 155, 200, 245, 290] : [110, 165, 235, 290];
  for (const x of stilts) ctx.fillRect(x - 5, 218, 10, 72);
  // thân đình
  ctx.fillStyle = WOOD;
  ctx.fillRect(90, 150, 220, 70);
  ctx.fillStyle = "rgba(255, 196, 92, 0.85)";
  const wins = f.has("windows") ? [105, 160, 215, 270] : [115, 185, 255];
  const ww = f.has("windows") ? 26 : 30;
  for (const x of wins) ctx.fillRect(x, 162, ww, 30);
  ctx.strokeStyle = "#2e1c0c";
  ctx.lineWidth = 2;
  for (const x of wins) ctx.strokeRect(x, 162, ww, 30);
  // mái hai tầng (ảnh AI thêm tầng thứ ba)
  eaveRoof(ctx, 200, 150, 130, 32);
  eaveRoof(ctx, 200, 120, 90, 34);
  if (f.has("roof3")) {
    ctx.fillStyle = "#4a2f18";
    ctx.fillRect(170, 64, 6, 22);
    ctx.fillRect(224, 64, 6, 22);
    eaveRoof(ctx, 200, 66, 55, 30);
  }
  // lưỡng long chầu nguyệt trên nóc
  const dragon = (x: number, dir: number) => {
    ctx.strokeStyle = "#3fa36b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - dir * 18, 90);
    ctx.quadraticCurveTo(x - dir * 6, 78, x + dir * 4, 84);
    ctx.stroke();
  };
  dragon(176, 1);
  dragon(224, -1);
  if (!f.has("pearl")) {
    ctx.fillStyle = "#f6d67c";
    ctx.beginPath();
    ctx.arc(200, 80, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c22f26";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // cờ đuôi nheo
  ctx.strokeStyle = "#6b431f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 150);
  ctx.lineTo(60, 48);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(60, 52);
  ctx.quadraticCurveTo(76, 56, 88, 62);
  ctx.lineTo(84, 74);
  ctx.quadraticCurveTo(72, 72, 60, 76);
  ctx.closePath();
  ctx.fillStyle = f.has("flag") ? AI_BLUE : "#c22f26";
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  lotus(ctx, 345, 296, f.has("lotus"));
}

function drawChuTeu(ctx: CanvasRenderingContext2D, f: Set<string>) {
  pondBand(ctx, 300);
  // bệ gỗ điều khiển dưới nước
  if (!f.has("base")) {
    ctx.fillStyle = "#6b431f";
    ctx.fillRect(165, 284, 70, 14);
    ctx.fillRect(193, 296, 14, 34);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(165, 284, 70, 14);
  }
  // chân
  ctx.fillStyle = "#8a4a24";
  ctx.fillRect(176, 248, 16, 36);
  ctx.fillRect(208, 248, 16, 36);
  // tay trái
  ctx.strokeStyle = "#8a4a24";
  ctx.lineCap = "round";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(158, 168);
  ctx.lineTo(124, 214);
  ctx.stroke();
  // tay phải: vẫy (gốc) hoặc buông (AI)
  ctx.beginPath();
  if (f.has("arm")) {
    ctx.moveTo(242, 170);
    ctx.lineTo(278, 204);
  } else {
    ctx.moveTo(242, 164);
    ctx.lineTo(298, 130);
  }
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.fillStyle = "#f2c99b";
  const hand = f.has("arm") ? [282, 208] : [304, 126];
  ctx.beginPath();
  ctx.arc(hand[0]!, hand[1]!, 10, 0, Math.PI * 2);
  ctx.arc(120, 220, 10, 0, Math.PI * 2);
  ctx.fill();
  // thân trần, bụng phệ
  ctx.fillStyle = "#c98a5a";
  ctx.beginPath();
  ctx.ellipse(200, 190, 52, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a4a24";
  ctx.lineWidth = 2;
  ctx.stroke();
  // dải yếm
  ctx.fillStyle = f.has("sash") ? AI_BLUE : GOLD;
  ctx.fillRect(150, 178, 100, 14);
  // khố đỏ
  ctx.fillStyle = "#c22f26";
  ctx.beginPath();
  ctx.moveTo(160, 232);
  ctx.lineTo(240, 232);
  ctx.lineTo(214, 258);
  ctx.lineTo(186, 258);
  ctx.closePath();
  ctx.fill();
  // đầu
  ctx.fillStyle = "#f2c99b";
  ctx.beginPath();
  ctx.arc(200, 86, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c98a5a";
  ctx.lineWidth = 2;
  ctx.stroke();
  // chỏm tóc
  ctx.fillStyle = "#1d130a";
  const tufts = f.has("hair") ? [184, 200, 216] : [200];
  for (const x of tufts) {
    ctx.beginPath();
    ctx.arc(x, 44, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  // mắt
  ctx.strokeStyle = "#1d130a";
  ctx.fillStyle = "#1d130a";
  ctx.lineWidth = 3;
  for (const x of [184, 216]) {
    ctx.beginPath();
    if (f.has("eyes")) {
      ctx.arc(x, 84, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.arc(x, 86, 7, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }
  // má hồng
  ctx.fillStyle = "rgba(230, 110, 110, 0.45)";
  ctx.beginPath();
  ctx.arc(172, 102, 7, 0, Math.PI * 2);
  ctx.arc(228, 102, 7, 0, Math.PI * 2);
  ctx.fill();
  // miệng
  ctx.beginPath();
  if (f.has("mouth")) {
    ctx.fillStyle = "#6b1d1d";
    ctx.arc(200, 116, 9, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#1d130a";
    ctx.lineWidth = 3;
    ctx.arc(200, 104, 15, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }
}

function drawKhueVanCac(ctx: CanvasRenderingContext2D, f: Set<string>) {
  // sân lát gạch
  ctx.fillStyle = "#d9c9a3";
  ctx.fillRect(0, 285, PANEL_W, PANEL_H - 285);
  // giếng Thiên Quang
  ctx.fillStyle = "#2b6a7a";
  ctx.strokeStyle = "#8a7a5a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (f.has("pond")) ctx.ellipse(200, 314, 62, 18, 0, 0, Math.PI * 2);
  else ctx.rect(138, 298, 124, 32);
  ctx.fill();
  ctx.stroke();
  // trụ gạch
  ctx.fillStyle = "#c9b89a";
  ctx.strokeStyle = "#8a7a5a";
  ctx.lineWidth = 2;
  const pillars = f.has("pillars") ? [95, 160, 290] : [95, 160, 240, 290];
  for (const x of pillars) {
    ctx.fillRect(x - 15, 214, 30, 72);
    ctx.strokeRect(x - 15, 214, 30, 72);
    for (let yy = 226; yy < 286; yy += 12) {
      ctx.beginPath();
      ctx.moveTo(x - 15, yy);
      ctx.lineTo(x + 15, yy);
      ctx.stroke();
    }
  }
  // mái dưới
  eaveRoof(ctx, 200, 214, 140, 20);
  // lan can gỗ
  ctx.fillStyle = f.has("railing") ? "#3f9a63" : "#7a4a24";
  ctx.fillRect(108, 180, 184, 14);
  ctx.strokeStyle = "#2e1c0c";
  ctx.lineWidth = 2;
  for (let x = 116; x < 292; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 180);
    ctx.lineTo(x, 194);
    ctx.stroke();
  }
  // gác trên bằng gỗ sơn son
  ctx.fillStyle = "#9b2f26";
  ctx.fillRect(118, 96, 164, 84);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(118, 96, 164, 84);
  // cửa sổ tròn tỏa tia — biểu tượng sao Khuê
  ctx.fillStyle = "#f6e3ac";
  ctx.strokeStyle = "#5d3a1e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (f.has("window")) ctx.rect(172, 108, 56, 56);
  else ctx.arc(200, 136, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(200, 136);
    ctx.lineTo(200 + Math.cos(a) * 26, 136 + Math.sin(a) * 26);
    ctx.stroke();
  }
  // mái trên: đầu đao cong (gốc) hoặc thẳng đuột (AI)
  eaveRoof(ctx, 200, 96, 112, 40, !f.has("roofTop"));
  // biển đề
  ctx.fillStyle = f.has("plaque") ? "#c22f26" : "#1f3d2e";
  ctx.fillRect(174, 74, 52, 16);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(174, 74, 52, 16);
}

const DRAWERS: Record<string, (ctx: CanvasRenderingContext2D, f: Set<string>) => void> = {
  "thuy-dinh": drawThuyDinh,
  "chu-teu": drawChuTeu,
  "khue-van-cac": drawKhueVanCac,
};

function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  title: string,
  badge: string,
  badgeColor: string,
  draw: () => void,
) {
  // khung gỗ
  ctx.fillStyle = "#3b2410";
  ctx.fillRect(x - 10, PANEL_Y - 34, PANEL_W + 20, PANEL_H + 44);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 10, PANEL_Y - 34, PANEL_W + 20, PANEL_H + 44);
  ctx.fillStyle = "#f3ead2";
  ctx.fillRect(x, PANEL_Y, PANEL_W, PANEL_H);
  ctx.font = "700 14px 'Be Vietnam Pro', sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#f6e3ac";
  ctx.fillText(title, x + 2, PANEL_Y - 12);
  ctx.textAlign = "right";
  ctx.fillStyle = badgeColor;
  ctx.fillText(badge, x + PANEL_W - 2, PANEL_Y - 12);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, PANEL_Y, PANEL_W, PANEL_H);
  ctx.clip();
  ctx.translate(x, PANEL_Y);
  draw();
  ctx.restore();
}

export function drawVerifyStage(ctx: CanvasRenderingContext2D, e: VerifyEngine) {
  const t = e.t;
  const a = e.artifact();
  drawBackdrop(ctx, t, "TỄU THẨM ĐỊNH", "MÚA RỐI NƯỚC – TÌM CHỖ AI VẼ SAI · HERITRUST FL-2", {
    pavilion: false,
  });
  drawWaterSurface(ctx, t);

  const draw = DRAWERS[a.id] ?? drawThuyDinh;
  const flags = e.flags();
  panel(ctx, LEFT_X, `Bản ghi gốc ${a.code}`, "✓ đã ký duyệt", "#7fd18b", () =>
    draw(ctx, new Set()),
  );
  panel(ctx, RIGHT_X, "Ảnh lan truyền", "⚠ FL-2 nghi AI sửa", "#f2c46b", () => draw(ctx, flags));

  // đánh dấu chỗ đã tìm thấy, gợi ý và chỗ bấm nhầm — trên cả hai khung
  for (const ox of [LEFT_X, RIGHT_X]) {
    ctx.save();
    ctx.translate(ox, PANEL_Y);
    for (const id of e.found) {
      const p = e.part(id);
      if (!p) continue;
      ctx.strokeStyle = "#e2453a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(
        p.rect.x + p.rect.w / 2,
        p.rect.y + p.rect.h / 2,
        p.rect.w / 2 + 8,
        p.rect.h / 2 + 8,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    if (e.hintPart) {
      const p = e.part(e.hintPart);
      if (p) {
        const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 4));
        ctx.strokeStyle = `rgba(242, 196, 107, ${pulse})`;
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 3;
        ctx.strokeRect(p.rect.x - 6, p.rect.y - 6, p.rect.w + 12, p.rect.h + 12);
        ctx.setLineDash([]);
      }
    }
    for (const m of e.marks) {
      if (m.ok) continue;
      ctx.strokeStyle = `rgba(30, 30, 30, ${1 - m.age})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(m.x - 9, m.y - 9);
      ctx.lineTo(m.x + 9, m.y + 9);
      ctx.moveTo(m.x + 9, m.y - 9);
      ctx.lineTo(m.x - 9, m.y + 9);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawAudience(ctx);
}
