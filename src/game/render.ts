// Đêm Hội Rối Nước — canvas rendering (khán giả nhìn vào sân khấu ao nước)
import { STAGE_W, STAGE_H, WATER_Y, DOCK_X, type Engine } from "./engine";

const INK = "rgba(12, 22, 40, 0.55)";

function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic star field (no Math.random at module scope — workerd-safe)
const STAR_SEEDS: { x: number; y: number; r: number; p: number }[] = [];
{
  const r = mulberry(77);
  for (let i = 0; i < 46; i++) {
    STAR_SEEDS.push({
      x: r() * STAGE_W,
      y: 10 + r() * 120,
      r: 0.6 + r() * 1.3,
      p: r() * 6.28,
    });
  }
}

const LANTERN_SLOTS = [110, 250, 390, 530, 670, 810];
const STAR_COLORS = ["#f7e6b0", "#f2d491", "#d8ecf7"];

function lantern(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number) {
  const sway = Math.sin(t * 1.6 + x) * 3 * s;
  // glow
  const g = ctx.createRadialGradient(x + sway, y + 14 * s, 2, x + sway, y + 14 * s, 34 * s);
  g.addColorStop(0, "rgba(255, 190, 90, 0.45)");
  g.addColorStop(1, "rgba(255, 190, 90, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - 40 * s + sway, y - 20 * s, 80 * s, 80 * s);
  ctx.save();
  ctx.translate(x + sway, y);
  ctx.fillStyle = "#8c1f1f";
  ctx.beginPath();
  ctx.ellipse(0, 14 * s, 11 * s, 13 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e9b64f";
  ctx.lineWidth = 1.4 * s;
  ctx.stroke();
  ctx.fillStyle = "#e9b64f";
  ctx.fillRect(-4 * s, 0, 8 * s, 4 * s);
  ctx.fillRect(-3 * s, 26 * s, 6 * s, 4 * s);
  // ribs
  ctx.strokeStyle = "rgba(255, 220, 140, 0.5)";
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 14 * s, (Math.abs(i) + 0.4) * 5 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPavilion(ctx: CanvasRenderingContext2D, t: number) {
  const baseY = WATER_Y + 6;
  // stilts
  ctx.fillStyle = "#4a2f18";
  [46, 92, 138, 184].forEach((x) => ctx.fillRect(x, baseY - 96, 10, 100));
  // reflection
  ctx.fillStyle = "rgba(6, 16, 28, 0.35)";
  [46, 92, 138, 184].forEach((x) => ctx.fillRect(x, baseY + 4, 10, 26));

  // body
  ctx.fillStyle = "#5d3a1e";
  ctx.fillRect(24, baseY - 128, 190, 34);
  // glowing windows
  const flick = 0.75 + Math.sin(t * 2.1) * 0.08;
  ctx.fillStyle = `rgba(255, 196, 92, ${flick})`;
  [48, 110, 172].forEach((x) => {
    ctx.fillRect(x, baseY - 124, 26, 26);
  });
  ctx.strokeStyle = "#2e1c0c";
  ctx.lineWidth = 2;
  [48, 110, 172].forEach((x) => ctx.strokeRect(x, baseY - 124, 26, 26));

  // balcony railing where Tễu stands
  ctx.strokeStyle = "#3b2410";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, baseY - 96);
  ctx.lineTo(210, baseY - 96);
  ctx.stroke();

  // roof tiers (curved, thủy đình style)
  const roof = (cx: number, w: number, y: number, h: number) => {
    ctx.beginPath();
    ctx.moveTo(cx - w, y);
    ctx.quadraticCurveTo(cx - w * 0.55, y - h * 0.9, cx, y - h);
    ctx.quadraticCurveTo(cx + w * 0.55, y - h * 0.9, cx + w, y);
    // upturned eaves
    ctx.quadraticCurveTo(cx + w * 1.12, y + 4, cx + w * 1.3, y - h * 0.42);
    ctx.lineTo(cx + w * 0.86, y + 6);
    ctx.lineTo(cx - w * 0.86, y + 6);
    ctx.quadraticCurveTo(cx - w * 1.12, y + 4, cx - w * 1.3, y - h * 0.42);
    ctx.closePath();
    const rg = ctx.createLinearGradient(cx, y - h, cx, y + 6);
    rg.addColorStop(0, "#b23730");
    rg.addColorStop(1, "#7e211d");
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.strokeStyle = "#e9b64f";
    ctx.lineWidth = 2.4;
    ctx.stroke();
  };
  roof(119, 118, baseY - 128, 34);
  roof(119, 84, baseY - 158, 30);

  // roof flags
  const flag = (x: number, y: number, dir: number) => {
    const wave = Math.sin(t * 3 + x) * 4;
    ctx.strokeStyle = "#6b431f";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 34);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 33);
    ctx.quadraticCurveTo(x + dir * 16, y - 30 + wave, x + dir * 27, y - 26 + wave);
    ctx.lineTo(x + dir * 24, y - 16 + wave * 0.6);
    ctx.quadraticCurveTo(x + dir * 13, y - 15, x, y - 18);
    ctx.closePath();
    ctx.fillStyle = "#c22f26";
    ctx.fill();
    ctx.strokeStyle = "#e9b64f";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  };
  flag(29, baseY - 160, -1);
  flag(209, baseY - 160, 1);

  drawTeu(ctx, 119, baseY - 96, t);
}

// Chú Tễu — chú rối dẫn chuyện, đứng trên thủy đình vẫy tay
function drawTeu(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const bounce = Math.abs(Math.sin(t * 2.4)) * 4;
  ctx.save();
  ctx.translate(x, y - bounce);
  // body
  ctx.fillStyle = "#8a4a24";
  ctx.beginPath();
  ctx.ellipse(0, -18, 12, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e9b64f";
  ctx.fillRect(-12, -18, 24, 4);
  // legs
  ctx.fillStyle = "#5d3a1e";
  ctx.fillRect(-8, -6, 5, 8);
  ctx.fillRect(3, -6, 5, 8);
  // waving arm
  ctx.save();
  ctx.translate(11, -26);
  ctx.rotate(Math.sin(t * 5) * 0.6 - 0.5);
  ctx.strokeStyle = "#8a4a24";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(12, -10);
  ctx.stroke();
  ctx.fillStyle = "#f2c99b";
  ctx.beginPath();
  ctx.arc(13, -11, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // other arm
  ctx.strokeStyle = "#8a4a24";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-10, -24);
  ctx.lineTo(-16, -14);
  ctx.stroke();
  // head
  ctx.fillStyle = "#f2c99b";
  ctx.beginPath();
  ctx.arc(0, -38, 10, 0, Math.PI * 2);
  ctx.fill();
  // hair tuft
  ctx.fillStyle = "#1d130a";
  ctx.beginPath();
  ctx.arc(0, -47, 3.2, 0, Math.PI * 2);
  ctx.fill();
  // happy eyes + big smile
  ctx.strokeStyle = "#1d130a";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(-4, -40, 2.2, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(4, -40, 2.2, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -37, 4.6, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.arc(0, -33.4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBoat(ctx: CanvasRenderingContext2D, e: Engine) {
  const x = e.boat.x;
  const y = WATER_Y + e.boat.bob;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(e.boat.tilt);

  // reflection
  ctx.fillStyle = "rgba(6, 16, 28, 0.3)";
  ctx.beginPath();
  ctx.ellipse(0, 22, 54, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // hull — thuyền rối sơn son
  ctx.beginPath();
  ctx.moveTo(-56, -6);
  ctx.quadraticCurveTo(0, 22, 56, -6);
  ctx.quadraticCurveTo(44, 6, 0, 10);
  ctx.quadraticCurveTo(-44, 6, -56, -6);
  ctx.closePath();
  const hg = ctx.createLinearGradient(0, -6, 0, 12);
  hg.addColorStop(0, "#a03a2c");
  hg.addColorStop(0.55, "#7e211d");
  hg.addColorStop(1, "#4f1815");
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.strokeStyle = "#e9b64f";
  ctx.lineWidth = 2;
  ctx.stroke();
  // deck band + gold dots
  ctx.strokeStyle = "#e9b64f";
  ctx.beginPath();
  ctx.moveTo(-52, -3);
  ctx.quadraticCurveTo(0, 13, 52, -3);
  ctx.stroke();
  ctx.fillStyle = "#e9b64f";
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(i * 19, 3 + Math.abs(i) * -0.4, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // curled bow ornaments (dragon-boat curls)
  const curl = (cx: number, dir: number) => {
    ctx.strokeStyle = "#e9b64f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, -14, 6, dir > 0 ? Math.PI * 0.9 : Math.PI * 1.6, dir > 0 ? Math.PI * 1.9 : Math.PI * 0.55);
    ctx.stroke();
  };
  curl(-56, -1);
  curl(56, 1);

  // ngư ông — rối gỗ sitting, facing rod tip side
  ctx.save();
  ctx.translate(-2, -8);
  const wob = Math.sin(e.t * 3 + 1) * 1.5;
  ctx.translate(0, wob);
  // robe
  ctx.fillStyle = "#f3e2c0";
  ctx.beginPath();
  ctx.moveTo(-11, 2);
  ctx.quadraticCurveTo(-9, -22, 0, -24);
  ctx.quadraticCurveTo(9, -22, 11, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#c9a35c";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // sash
  ctx.fillStyle = "#7e211d";
  ctx.fillRect(-10, -10, 20, 4);
  // head
  ctx.fillStyle = "#f7dcb4";
  ctx.beginPath();
  ctx.arc(0, -31, 8.5, 0, Math.PI * 2);
  ctx.fill();
  // hair bun
  ctx.fillStyle = "#1d130a";
  ctx.beginPath();
  ctx.arc(0, -40, 3, 0, Math.PI * 2);
  ctx.fill();
  // face
  ctx.strokeStyle = "#1d130a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(-3, -32, 1.8, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(3, -32, 1.8, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -29, 3, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  // conical hat
  ctx.fillStyle = "#d9a948";
  ctx.beginPath();
  ctx.moveTo(-12, -36);
  ctx.lineTo(0, -47);
  ctx.lineTo(12, -36);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#a87718";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  // fishing rod — bamboo pole held toward the front
  const tip = e.rodTip();
  const handX = 8;
  const handY = -30;
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(e.rod.angle);
  ctx.strokeStyle = "#6b431f";
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(40 + Math.abs(e.rod.angle) * 6, -14 - Math.abs(e.rod.angle) * 4);
  ctx.stroke();
  ctx.strokeStyle = "#8a5a2b";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(6, 4);
  ctx.lineTo(36 + Math.abs(e.rod.angle) * 6, -12 - Math.abs(e.rod.angle) * 4);
  ctx.stroke();
  ctx.restore();

  // line + hook
  if (e.hook.state !== "idle") {
    ctx.strokeStyle = "rgba(240, 240, 230, 0.75)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    // slight sag
    const midY = Math.max(tip.y, e.hook.y * 0.4 + tip.y * 0.6) + 4;
    ctx.quadraticCurveTo((tip.x + e.hook.x) / 2, midY, e.hook.x, e.hook.y);
    ctx.stroke();
    // bobber near surface when hook is under water
    if (e.hook.y > WATER_Y) {
      ctx.fillStyle = "#d94f3d";
      ctx.beginPath();
      ctx.arc(e.hook.x, WATER_Y - 3, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f6f2e6";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // hook curve
    ctx.strokeStyle = "#e9b64f";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(e.hook.x, e.hook.y + 4, 4, -0.4, Math.PI * 0.9);
    ctx.stroke();
    if (e.hook.fish) {
      drawFishShape(ctx, e.hook.fish.x, e.hook.fish.y, e.t, true);
      // "!« bite alert
      ctx.fillStyle = "#e9b64f";
      ctx.beginPath();
      ctx.arc(e.hook.x, WATER_Y - 40, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4f1815";
      ctx.font = "700 15px 'Baloo 2', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("!", e.hook.x, WATER_Y - 34);
    }
  }
  ctx.restore();
}

function drawFishShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  hooked: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  const flick = Math.sin(t * 9) * 0.35;
  ctx.rotate(hooked ? Math.sin(t * 12) * 0.25 : 0);
  // body
  ctx.fillStyle = hooked ? "#7fb2a8" : "#3f7d84";
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // belly
  ctx.fillStyle = hooked ? "#a8cfc5" : "#6fa3a6";
  ctx.beginPath();
  ctx.ellipse(2, 2.5, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // tail
  ctx.save();
  ctx.translate(-14, 0);
  ctx.rotate(flick);
  ctx.fillStyle = hooked ? "#7fb2a8" : "#356d74";
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-9, -6);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-9, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // fin
  ctx.fillStyle = "#2d5d64";
  ctx.beginPath();
  ctx.moveTo(-2, -6);
  ctx.lineTo(4, -10);
  ctx.lineTo(6, -5);
  ctx.closePath();
  ctx.fill();
  // eye
  ctx.fillStyle = "#f6f2e6";
  ctx.beginPath();
  ctx.arc(9, -1.5, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#14232e";
  ctx.beginPath();
  ctx.arc(9.6, -1.5, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLotus(ctx: CanvasRenderingContext2D, e: Engine) {
  for (const l of e.lotus) {
    const r = mulberry(l.seed);
    ctx.save();
    ctx.translate(l.x, WATER_Y + 2);
    // pads
    const pads: [number, number, number][] = [
      [-30, 4, 20],
      [4, 8, 24],
      [34, 3, 17],
      [-4, -2, 15],
    ];
    // reflection
    ctx.fillStyle = "rgba(8, 20, 30, 0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 46, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const [px, py, pr] of pads) {
      ctx.fillStyle = "#2f7d4f";
      ctx.beginPath();
      ctx.ellipse(px, py, pr, pr * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3f9a63";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(px, py, pr, pr * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - pr, py);
      ctx.lineTo(px, py + 2);
      ctx.stroke();
    }
    // flower
    const fx = 12 + r() * 6;
    const sway = Math.sin(e.t * 1.8 + l.seed) * 2;
    ctx.save();
    ctx.translate(fx, -6 + sway);
    for (let p = 0; p < 6; p++) {
      const a = -Math.PI / 2 + (p - 2.5) * 0.5;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = "#f2a7bb";
      ctx.beginPath();
      ctx.ellipse(0, -7, 3.6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d97f9d";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#e9b64f";
    ctx.beginPath();
    ctx.arc(0, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}

function drawDock(ctx: CanvasRenderingContext2D, e: Engine) {
  if (!e.dockActive) return;
  const y = WATER_Y - 16;
  ctx.fillStyle = "#5d3a1e";
  ctx.fillRect(DOCK_X, y, STAGE_W - DOCK_X + 10, 10);
  ctx.strokeStyle = "#e9b64f";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(DOCK_X, y, STAGE_W - DOCK_X + 10, 10);
  // planks
  ctx.strokeStyle = "#3b2410";
  for (let px = DOCK_X + 12; px < STAGE_W; px += 18) {
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + 10);
    ctx.stroke();
  }
  // posts
  ctx.fillStyle = "#4a2f18";
  [DOCK_X + 8, DOCK_X + 52, DOCK_X + 92].forEach((px) => {
    ctx.fillRect(px, y + 8, 7, 40);
  });
  // lantern post + flag
  const px = DOCK_X + 30;
  ctx.strokeStyle = "#6b431f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, y);
  ctx.lineTo(px, y - 44);
  ctx.stroke();
  lantern(ctx, px, y - 40, 0.8, e.t);
  const wave = Math.sin(e.t * 3) * 3;
  ctx.beginPath();
  ctx.moveTo(px + 2, y - 42);
  ctx.quadraticCurveTo(px + 16, y - 39 + wave, px + 26, y - 35 + wave);
  ctx.lineTo(px + 23, y - 27 + wave * 0.6);
  ctx.quadraticCurveTo(px + 13, y - 26, px + 2, y - 29);
  ctx.closePath();
  ctx.fillStyle = "#c22f26";
  ctx.fill();
  ctx.strokeStyle = "#e9b64f";
  ctx.lineWidth = 1;
  ctx.stroke();
  // sign
  ctx.fillStyle = "#e9b64f";
  ctx.font = "700 13px 'Baloo 2', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BẾN", DOCK_X + 62, y - 4);
}

export function drawStage(ctx: CanvasRenderingContext2D, e: Engine) {
  const t = e.t;

  // ---- night sky ----
  const sky = ctx.createLinearGradient(0, 0, 0, WATER_Y);
  sky.addColorStop(0, "#0c1430");
  sky.addColorStop(0.7, "#122a44");
  sky.addColorStop(1, "#173a52");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, STAGE_W, WATER_Y);

  // stars
  let starIdx = 0;
  for (const s of STAR_SEEDS) {
    const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.3 + s.p));
    ctx.fillStyle = STAR_COLORS[starIdx % STAR_COLORS.length] ?? "#f7e6b0";
    ctx.globalAlpha = tw * 0.9;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    starIdx++;
  }
  ctx.globalAlpha = 1;

  // moon + glow
  const moonX = 742;
  const moonY = 88;
  const mg = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 90);
  mg.addColorStop(0, "rgba(250, 230, 170, 0.5)");
  mg.addColorStop(1, "rgba(250, 230, 170, 0)");
  ctx.fillStyle = mg;
  ctx.fillRect(moonX - 95, moonY - 95, 190, 190);
  ctx.fillStyle = "#f6e3ac";
  ctx.beginPath();
  ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(220, 195, 140, 0.6)";
  ctx.beginPath();
  ctx.arc(moonX - 8, moonY - 5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(moonX + 9, moonY + 7, 3.4, 0, Math.PI * 2);
  ctx.fill();

  // bamboo silhouette line
  ctx.fillStyle = "#0a1122";
  ctx.beginPath();
  ctx.moveTo(0, WATER_Y - 26);
  for (let x = 0; x <= STAGE_W; x += 60) {
    ctx.quadraticCurveTo(x + 15, WATER_Y - 44 - Math.sin(x) * 8, x + 60, WATER_Y - 26);
  }
  ctx.lineTo(STAGE_W, WATER_Y);
  ctx.lineTo(0, WATER_Y);
  ctx.closePath();
  ctx.fill();

  // ---- pavilion + lanterns + curtain + banner ----
  drawPavilion(ctx, t);

  // lantern string
  ctx.strokeStyle = "rgba(233, 182, 79, 0.55)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(258, 30);
  ctx.quadraticCurveTo(600, 66, 950, 30);
  ctx.stroke();
  for (const lx of LANTERN_SLOTS) {
    const ly = 30 + Math.sin(((lx - 258) / 692) * Math.PI) * 32;
    lantern(ctx, lx, ly, 1, t);
  }

  // scalloped festival curtain on top
  ctx.fillStyle = "#a03028";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(STAGE_W, 0);
  ctx.lineTo(STAGE_W, 16);
  for (let x = STAGE_W; x >= 0; x -= 60) {
    ctx.quadraticCurveTo(x - 30, 34, x - 60, 16);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#e9b64f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = STAGE_W; x >= 0; x -= 60) {
    ctx.quadraticCurveTo(x - 30, 34, x - 60, 16);
  }
  ctx.stroke();
  // tassels
  ctx.fillStyle = "#e9b64f";
  for (let x = 30; x < STAGE_W; x += 60) {
    ctx.fillRect(x - 1.4, 32, 2.8, 7);
  }

  // banner
  ctx.font = "800 30px 'Baloo 2', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(10, 16, 34, 0.55)";
  ctx.fillText("ĐÊM HỘI RỐI NƯỚC", STAGE_W / 2 + 2, 72);
  const bg = ctx.createLinearGradient(0, 48, 0, 76);
  bg.addColorStop(0, "#f6d67c");
  bg.addColorStop(1, "#e9b64f");
  ctx.fillStyle = bg;
  ctx.fillText("ĐÊM HỘI RỐI NƯỚC", STAGE_W / 2, 70);
  ctx.font = "600 13px 'Be Vietnam Pro', sans-serif";
  ctx.fillStyle = "rgba(246, 230, 176, 0.8)";
  ctx.fillText("MÚA RỐI NƯỚC – TÍCH THẢY CÂU BẮT CÁ", STAGE_W / 2, 92);

  // ---- water ----
  const wg = ctx.createLinearGradient(0, WATER_Y, 0, STAGE_H);
  wg.addColorStop(0, "#1c4a5c");
  wg.addColorStop(0.5, "#123647");
  wg.addColorStop(1, "#0a2130");
  ctx.fillStyle = wg;
  ctx.fillRect(0, WATER_Y, STAGE_W, STAGE_H - WATER_Y);

  // waterline highlight
  ctx.fillStyle = "rgba(120, 210, 220, 0.35)";
  ctx.fillRect(0, WATER_Y, STAGE_W, 2);

  // moon reflection streak
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#f6e3ac";
  for (let i = 0; i < 7; i++) {
    const yy = WATER_Y + 14 + i * 13;
    const off = Math.sin(t * 1.7 + i) * 12;
    ctx.fillRect(moonX - 26 + off, yy, 52 - i * 5, 4);
  }
  ctx.restore();

  // shimmer arcs
  ctx.strokeStyle = "rgba(150, 220, 225, 0.08)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const yy = WATER_Y + 24 + i * 30;
    const off = ((t * 26 + i * 90) % (STAGE_W + 160)) - 80;
    ctx.beginPath();
    ctx.arc(off, yy, 26, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(off + 300, yy + 14, 20, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  // ripples
  for (const r of e.ripples) {
    ctx.strokeStyle = `rgba(190, 235, 235, ${r.alpha})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, r.r, r.r * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // swimming fish (shadowed under the surface)
  for (const f of e.fishes) {
    if (f.state === "escaping" || f.state === "hooked") continue;
    // soft shadow
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(f.x + 4, f.y + 7, 14, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    if (f.jump > 0) {
      // above surface during a jump
      ctx.restore();
      ctx.save();
      drawFishShape(ctx, f.x, f.y, t, false);
    } else {
      ctx.globalAlpha = 0.85;
      drawFishShape(ctx, f.x, f.y, t, false);
      if (f.flip) {
        // face travel direction
      }
    }
    ctx.restore();
  }
  // escaping fish dart
  for (const f of e.fishes) {
    if (f.state !== "escaping") continue;
    ctx.save();
    ctx.globalAlpha = 0.9;
    drawFishShape(ctx, f.x, f.y, t, false);
    ctx.restore();
  }

  drawDock(ctx, e);
  drawBoat(ctx, e);
  drawLotus(ctx, e);

  // splash droplets
  ctx.fillStyle = "rgba(225, 245, 245, 0.9)";
  for (const d of e.drops) {
    ctx.globalAlpha = Math.min(1, d.life * 1.6);
    ctx.beginPath();
    ctx.arc(d.x, d.y, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // audience silhouettes at the very front (bên khán đài)
  ctx.fillStyle = "rgba(6, 10, 20, 0.85)";
  ctx.beginPath();
  ctx.moveTo(0, STAGE_H);
  for (let x = 0; x <= STAGE_W; x += 46) {
    const h = 16 + ((x * 7919) % 13);
    ctx.lineTo(x, STAGE_H - h);
    ctx.arc(x + 10, STAGE_H - h, 9, Math.PI, Math.PI * 2);
    ctx.lineTo(x + 23, STAGE_H);
  }
  ctx.closePath();
  ctx.fill();
}
