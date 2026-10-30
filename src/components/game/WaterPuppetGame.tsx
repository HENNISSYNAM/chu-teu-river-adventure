import { useCallback, useEffect, useRef, useState } from "react";
import {
  Engine,
  STAGE_W,
  STAGE_H,
  type InputState,
} from "@/game/engine";
import { drawStage } from "@/game/render";
import { GameAudio } from "@/game/audio";
import { HandController, type HandStatus, type HandTuning } from "@/game/hand-control";

type Phase = "menu" | "playing" | "paused" | "result";

const TEU_INTRO =
  "Ta đây! Tễu đây! Đêm nay đầm sen vui hội, ta cùng chú chèo thuyền thả câu bắt cá nhé!";
const TEU_LINES: Record<string, string> = {
  bite: "Cá cắn câu rồi! Giữ mở bàn tay (hoặc giữ nút) để kéo cần lên!",
  catch: "Trời ơi, được một con to! Giữ chac… à nhầm, giữ nguyên thế!",
  catch2: "Cá đèn lồng lại cắn câu rồi! Khéo tay ghê!",
  catch3: "Con thứ ba sắp đủ rồi, chăm chú vào nào!",
  collide: "Úi da! Bụi sen vướng mất rồi, đi chậm mà né sen nhé!",
  empty: "Chưa có cá cắn, đợi chút rồi thả lại nhé!",
  escape: "A! Cá vùng thoát mất rồi! Lần này kéo nhanh lên nào!",
  dock: "Đủ ba con cá rồi! Chèo thuyền về bến bên phải nào!",
  win: "Tết Tết Tết Tết! Tết cảnh lành, phúc lộc nhiều! Cảm ơn khán giả nhé!",
};

const GUIDE_GESTURES = [
  {
    icon: "🤚",
    title: "Tay trái lái thuyền",
    desc: "Di chuyển tay trái sang trái hoặc phải để chèo thuyền né bụi sen.",
  },
  {
    icon: "🫱",
    title: "Tay phải cầm sào",
    desc: "Tay phải đưa lên / hạ xuống để nâng, hạ cần câu.",
  },
  {
    icon: "🤏",
    title: "Chụm hai ngón để thả câu",
    desc: "Chụm ngón cái và ngón trỏ tay phải để buông câu xuống nước.",
  },
  {
    icon: "🖐️",
    title: "Mở bàn tay để kéo cá",
    desc: "Khi cá cắn câu, mở bàn tay phải (hoặc giữ nút) để kéo cá lên.",
  },
];

function modeLabel(mode: "hand" | "manual") {
  return mode === "hand" ? "Camera" : "Nút bấm";
}

export default function WaterPuppetGame() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [mode, setMode] = useState<"hand" | "manual">("manual");
  const [cameraStatus, setCameraStatus] = useState<HandStatus | "off">("off");
  const [cameraError, setCameraError] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [teuLine, setTeuLine] = useState(TEU_INTRO);
  const [fishCaught, setFishCaught] = useState(0);
  const [dockActive, setDockActive] = useState(false);
  const [result, setResult] = useState({ time: 0, skill: 100, casts: 0 });
  const [muted, setMuted] = useState(false);
  const [handLost, setHandLost] = useState(false);
  const [tuning, setTuning] = useState<HandTuning>({ sensitivity: 1.1, deadZone: 0.12 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const audioRef = useRef<GameAudio | null>(null);
  const handRef = useRef<HandController | null>(null);
  const phaseRef = useRef<Phase>("menu");
  const modeRef = useRef<"hand" | "manual">("manual");
  const catchIdx = useRef(0);
  const handSeenAt = useRef(0);

  const manual = useRef({
    left: false,
    right: false,
    rodUp: false,
    rodDown: false,
    castEdge: false,
    reel: false,
    dragAxis: 0,
  });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    if (handRef.current) handRef.current.tuning = tuning;
  }, [tuning]);

  const audio = () => {
    if (!audioRef.current) audioRef.current = new GameAudio();
    return audioRef.current;
  };

  // ---------------- camera ----------------
  const ensureCamera = useCallback(async () => {
    if (handRef.current) return handRef.current.status === "running";
    const video = videoRef.current;
    const preview = previewRef.current;
    if (!video || !preview) return false;
    setCameraStatus("loading");
    setCameraError("");
    const ctl = await HandController.create(video, preview, tuning, (s, msg) => {
      setCameraStatus(s);
      if (msg) setCameraError(msg);
    });
    handRef.current = ctl;
    return ctl.status === "running";
  }, [tuning]);

  const stopCamera = useCallback(() => {
    handRef.current?.stop();
    handRef.current = null;
    setCameraStatus("off");
  }, []);

  // ---------------- keyboard ----------------
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const m = manual.current;
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          m.left = true;
          break;
        case "ArrowRight":
        case "d":
        case "D":
          m.right = true;
          break;
        case "ArrowUp":
        case "w":
        case "W":
          m.rodUp = true;
          break;
        case "ArrowDown":
        case "s":
        case "S":
          m.rodDown = true;
          break;
        case " ":
          e.preventDefault();
          m.castEdge = true;
          m.reel = true;
          break;
        case "Escape":
        case "p":
        case "P":
          if (phaseRef.current === "playing") setPhase("paused");
          else if (phaseRef.current === "paused") setPhase("playing");
          break;
      }
    };
    const up = (e: KeyboardEvent) => {
      const m = manual.current;
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          m.left = false;
          break;
        case "ArrowRight":
        case "d":
        case "D":
          m.right = false;
          break;
        case "ArrowUp":
        case "w":
        case "W":
          m.rodUp = false;
          break;
        case "ArrowDown":
        case "s":
        case "S":
          m.rodDown = false;
          break;
        case " ":
          m.reel = false;
          break;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // ---------------- game loop ----------------
  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = STAGE_W * dpr;
    canvas.height = STAGE_H * dpr;

    let raf = 0;
    let last = performance.now();
    let lastProgressPush = 0;

    const handleEvents = (events: string[]) => {
      for (const ev of events) {
        const a = audio();
        switch (ev) {
          case "bite":
            a.bite();
            setTeuLine(TEU_LINES["bite"] ?? "");
            break;
          case "catch":
            a.caught();
            catchIdx.current += 1;
            setTeuLine(TEU_LINES[`catch${(catchIdx.current % 3) + 1}`] ?? TEU_LINES["catch"] ?? "");
            setFishCaught((f) => Math.min(3, f + 1));
            break;
          case "collide":
            a.thud();
            setTeuLine(TEU_LINES["collide"] ?? "");
            break;
          case "empty":
            a.drop();
            setTeuLine(TEU_LINES["empty"] ?? "");
            break;
          case "escape":
            a.drop();
            setTeuLine(TEU_LINES["escape"] ?? "");
            break;
          case "goal-dock":
            a.goal();
            setDockActive(true);
            setTeuLine(TEU_LINES["dock"] ?? "");
            break;
          case "win": {
            a.win();
            setTeuLine(TEU_LINES["win"] ?? "");
            const e = engineRef.current!;
            setResult({ time: e.elapsed, skill: e.skillScore(), casts: e.casts });
            window.setTimeout(() => setPhase("result"), 1800);
            break;
          }
        }
      }
    };

    const frame = (now: number) => {
      const e = engineRef.current;
      if (!e || phaseRef.current !== "playing") return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const input: InputState = { moveAxis: 0, rodAxis: 0, castPressed: false, reelHeld: false };
      const m = manual.current;

      // điều khiển tay
      if (modeRef.current === "hand" && handRef.current) {
        const hf = handRef.current.frame;
        if (hf.leftPresent || hf.rightPresent) handSeenAt.current = now;
        input.moveAxis = hf.moveAxis;
        input.rodAxis = hf.rodAxis;
        input.castPressed = hf.castPressed;
        hf.castPressed = false;
        input.reelHeld = hf.reelHeld;
        // tay biến mất quá lâu → nhắc chuyển chế độ
        if (now - handSeenAt.current > 3200 && (hf.leftPresent || hf.rightPresent) === false) {
          setHandLost(true);
        } else if (hf.leftPresent || hf.rightPresent) {
          setHandLost(false);
        }
      }

      // điều khiển thường luôn hoạt động (đè lên khi có bấm)
      const keyAxis = (m.right ? 1 : 0) - (m.left ? 1 : 0);
      const rodKey = (m.rodDown ? 1 : 0) - (m.rodUp ? 1 : 0);
      if (keyAxis !== 0 || Math.abs(m.dragAxis) > 0.05) input.moveAxis = keyAxis || m.dragAxis;
      if (rodKey !== 0) input.rodAxis = rodKey;
      if (m.castEdge) input.castPressed = true;
      if (m.reel) input.reelHeld = true;
      m.castEdge = false;
      m.dragAxis = 0;

      e.update(dt, input);
      handleEvents(e.events.splice(0, e.events.length));

      // tiến độ HUD nhẹ nhàng
      if (now - lastProgressPush > 400) {
        lastProgressPush = now;
        // nothing else — HUD cập nhật qua sự kiện
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawStage(ctx, e);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // ---------------- actions ----------------
  const startGame = async (useCamera: boolean) => {
    engineRef.current = engineRef.current ?? new Engine();
    engineRef.current.reset();
    setFishCaught(0);
    setDockActive(false);
    setTeuLine(TEU_INTRO);
    catchIdx.current = 0;
    handSeenAt.current = performance.now();
    setHandLost(false);
    if (useCamera) {
      const ok = await ensureCamera();
      setMode(ok ? "hand" : "manual");
      modeRef.current = ok ? "hand" : "manual";
      if (!ok) setTeuLine("Chưa bật được camera, mình chơi bằng nút bấm trước nhé!");
    } else {
      setMode("manual");
      modeRef.current = "manual";
    }
    audioRef.current = audioRef.current ?? new GameAudio();
    audioRef.current.setMuted(muted);
    audioRef.current.start();
    setPhase("playing");
  };

  const toggleMode = async () => {
    if (mode === "manual") {
      const ok = await ensureCamera();
      if (ok) {
        setMode("hand");
        modeRef.current = "hand";
        handSeenAt.current = performance.now();
      } else {
        setTeuLine("Chưa bật được camera, cứ chơi bằng nút bấm nhé!");
      }
    } else {
      setMode("manual");
      modeRef.current = "manual";
      setHandLost(false);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audio().setMuted(next);
  };

  const replay = () => {
    engineRef.current?.reset();
    setFishCaught(0);
    setDockActive(false);
    setTeuLine(TEU_INTRO);
    catchIdx.current = 0;
    setPhase("playing");
  };

  const backToMenu = () => {
    setPhase("menu");
    audio().stop();
  };

  // ---------------- canvas steering (kéo chuột / vuốt) ----------------
  const dragStartX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== "playing") return;
    dragStartX.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current == null) return;
    const dx = e.clientX - dragStartX.current;
    manual.current.dragAxis = Math.max(-1, Math.min(1, dx / 110));
    if (Math.abs(manual.current.dragAxis) > 0.9) dragStartX.current = e.clientX;
  };
  const onPointerUp = () => {
    dragStartX.current = null;
    manual.current.dragAxis = 0;
  };

  const touchBtn = (key: "left" | "right" | "rodUp" | "rodDown", on: boolean) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      manual.current[key] = on;
    },
    onPointerUp: () => {
      manual.current[key] = false;
    },
    onPointerLeave: () => {
      manual.current[key] = false;
    },
  });
  const castBtn = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      manual.current.castEdge = true;
      manual.current.reel = true;
    },
    onPointerUp: () => {
      manual.current.reel = false;
    },
    onPointerLeave: () => {
      manual.current.reel = false;
    },
  };

  const playing = phase === "playing" || phase === "paused";
  const cameraOn = cameraStatus === "running";

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-3 py-4 sm:py-6">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas
        ref={previewRef}
        width={200}
        height={150}
        className={`fixed bottom-3 right-3 z-40 rounded-xl border-2 border-gold/60 shadow-2xl ${
          cameraOn && showPreview && playing ? "" : "hidden"
        }`}
      />

      {/* ============ SÂN KHẤU ============ */}
      {playing && (
        <div className="relative w-full max-w-5xl">
          <div className="panel relative overflow-hidden rounded-3xl border-2 border-gold/50">
            <canvas
              ref={canvasRef}
              className="block w-full touch-none"
              style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />

            {/* HUD — nhiệm vụ + tiến độ */}
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
              <div className="signboard max-w-[240px] text-sm text-foreground">
                <span className="font-display font-bold text-gold">Mục tiêu: </span>
                {dockActive ? "Chèo thuyền về bến →" : "Bắt 3 con cá rồi về bến"}
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm transition-all ${
                      i < fishCaught
                        ? "border-gold bg-gold text-gold-foreground shadow-md shadow-gold/40"
                        : "border-gold/40 bg-card/70 text-muted-foreground"
                    }`}
                  >
                    🐟
                  </span>
                ))}
                <span className="chip ml-1">{fishCaught}/3 con cá</span>
              </div>
            </div>

            {/* Nút: tạm dừng, âm thanh, đổi chế độ, ẩn/hiện camera */}
            <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <button className="btn-icon" onClick={toggleMute} aria-label="Bật tắt âm thanh">
                  {muted ? "🔇" : "🔊"}
                </button>
                <button className="btn-icon" onClick={() => setPhase("paused")} aria-label="Tạm dừng">
                  ⏸
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  className={`btn-icon text-xs font-bold ${mode === "hand" ? "active" : ""}`}
                  onClick={toggleMode}
                  aria-label="Đổi chế độ điều khiển"
                  title="Đổi chế độ điều khiển"
                >
                  {mode === "hand" ? "🖐️" : "🕹️"}
                </button>
                {cameraOn && (
                  <button
                    className="btn-icon"
                    onClick={() => setShowPreview((v) => !v)}
                    aria-label="Ẩn hiện hình xem trước camera"
                  >
                    {showPreview ? "📷" : "🚫📷"}
                  </button>
                )}
              </div>
              {mode === "hand" && cameraStatus === "loading" && (
                <span className="chip animate-pulse">Đang bật camera…</span>
              )}
            </div>

            {/* Lời chú Tễu */}
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-start">
              <div className="signboard max-w-[92%] sm:max-w-[70%]">
                <p className="text-sm leading-snug text-foreground sm:text-base">
                  <span className="font-display font-bold text-gold">Chú Tễu: </span>
                  {teuLine}
                </p>
              </div>
            </div>
          </div>

          {/* Điều khiển thường — luôn sẵn để chơi bất cứ lúc nào */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <div className="flex gap-2">
              <button className="touchpad" {...touchBtn("left", true)} aria-label="Chèo sang trái">
                ◀
              </button>
              <button className="touchpad" {...touchBtn("right", true)} aria-label="Chèo sang phải">
                ▶
              </button>
            </div>
            <div className="flex gap-2">
              <button className="touchpad" {...touchBtn("rodUp", true)} aria-label="Nâng cần">
                ▲
              </button>
              <button className="touchpad" {...touchBtn("rodDown", true)} aria-label="Hạ cần">
                ▼
              </button>
            </div>
            <button className="touchpad-sm h-16" {...castBtn} aria-label="Thả câu / kéo cần">
              🎣 Thả / Kéo
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Bàn phím: ← → chèo thuyền · ↑ ↓ cần câu · Space thả câu / giữ để kéo · P tạm dừng
            {mode === "hand" ? " · hoặc dùng hai bàn tay trước camera" : ""}
          </p>
        </div>
      )}

      {/* ============ THÔNG BÁO MẤT TAY ============ */}
      {playing && handLost && mode === "hand" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="panel max-w-sm p-6 text-center">
            <p className="text-4xl">🖐️</p>
            <h3 className="mt-3 font-display text-xl font-bold text-gold">
              Đưa hai bàn tay vào khung hình
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tay trái lái thuyền, tay phải cầm sào. Hoặc chơi tiếp bằng nút bấm bên dưới.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button className="btn-gold" onClick={() => setHandLost(false)}>
                Đã thấy, chơi tiếp
              </button>
              <button className="btn-outline" onClick={() => { setMode("manual"); modeRef.current = "manual"; setHandLost(false); }}>
                Dùng điều khiển thường
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TẠM DỪNG ============ */}
      {phase === "paused" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6">
            <h2 className="text-center font-display text-2xl font-bold text-gold">Nghỉ giải lao</h2>
            <div className="mt-5 flex flex-col gap-2">
              <button className="btn-primary" onClick={() => setPhase("playing")}>
                ▶ Tiếp tục biểu diễn
              </button>
              <button className="btn-gold" onClick={replay}>
                ↺ Chơi lại từ đầu
              </button>
              <button className="btn-outline" onClick={toggleMode}>
                {mode === "hand" ? "🕹️ Đổi sang điều khiển thường" : "🖐️ Đổi sang điều khiển camera"}
              </button>
              <button className="btn-quiet" onClick={backToMenu}>
                ⌂ Về màn hình đầu
              </button>
            </div>
            {mode === "hand" && (
              <div className="mt-5 rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="mb-2 font-display text-sm font-bold text-gold">
                  Tinh chỉnh điều khiển camera
                </p>
                <label className="block text-xs text-muted-foreground">
                  Độ nhạy: {tuning.sensitivity.toFixed(1)}
                  <input
                    type="range"
                    min={0.6}
                    max={2}
                    step={0.1}
                    value={tuning.sensitivity}
                    onChange={(e) => setTuning((t) => ({ ...t, sensitivity: +e.target.value }))}
                    className="mt-1 w-full accent-[color:var(--gold)]"
                  />
                </label>
                <label className="mt-2 block text-xs text-muted-foreground">
                  Vùng chết (tránh rung): {(tuning.deadZone * 100).toFixed(0)}%
                  <input
                    type="range"
                    min={0.04}
                    max={0.3}
                    step={0.02}
                    value={tuning.deadZone}
                    onChange={(e) => setTuning((t) => ({ ...t, deadZone: +e.target.value }))}
                    className="mt-1 w-full accent-[color:var(--gold)]"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ MÀN HÌNH ĐẦU ============ */}
      {phase === "menu" && (
        <div className="w-full max-w-3xl py-6">
          <div className="text-center">
            <p className="chip mb-3">🏮 Đêm hội bên ao làng · Sân khấu rối nước 🏮</p>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-gold sm:text-6xl">
              Đêm Hội Rối Nước
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Chèo thuyền rối qua đầm sen, né bụi sen, thả câu bắt ba con cá rồi đưa thuyền về
              bến — điều khiển bằng chuyển động bàn tay hoặc bằng nút bấm.
            </p>
          </div>

          <div className="panel mt-6 p-5">
            <p className="text-sm leading-relaxed text-foreground">
              <span className="font-display text-base font-bold text-gold">Chú Tễu: </span>
              {TEU_INTRO}
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button className="btn-primary w-full text-lg sm:w-auto" onClick={() => startGame(true)}>
              🖐️ Bật camera &amp; chơi
            </button>
            <button className="btn-gold w-full text-lg sm:w-auto" onClick={() => startGame(false)}>
              🕹️ Chơi bằng nút bấm
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Hình ảnh camera chỉ xử lý ngay trên thiết bị của bạn — không tải lên hay lưu lại đâu.
          </p>
          {cameraError && (
            <p className="mt-3 text-center text-sm text-destructive-foreground">
              {cameraError}
            </p>
          )}

          <div className="mt-8">
            <h2 className="text-center font-display text-xl font-bold text-gold">
              Hướng dẫn cử chỉ
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GUIDE_GESTURES.map((g) => (
                <div key={g.title} className="panel flex items-start gap-3 p-4">
                  <span className="text-3xl leading-none">{g.icon}</span>
                  <div>
                    <h3 className="font-display text-sm font-bold text-gold">{g.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="panel mt-3 p-4">
              <h3 className="font-display text-sm font-bold text-gold">Điều khiển thường</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Bàn phím: ← → chèo thuyền, ↑ ↓ cần câu, Space thả câu (giữ để kéo), P tạm dừng.
                Trên điện thoại: dùng các nút to dưới sân khấu hoặc kéo ngón tay trên mặt nước.
                Đổi chế độ bất cứ lúc nào bằng nút trên góc phải sân khấu.
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Cảm hứng từ nghệ thuật múa rối nước Việt Nam 🎭
          </p>
        </div>
      )}

      {/* ============ MÀN KẾT ============ */}
      {phase === "result" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6 text-center">
            <p className="text-5xl">🏮 🎉 🏮</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-gold">
              Hoàn thành tích trò!
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              “Tết Tết Tết Tết! Tết cảnh lành, phúc lộc nhiều!” — chú Tễu tạ ơn khán giả.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">3/3</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Cá đã bắt</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">
                  {Math.floor(result.time / 60)}:{String(Math.floor(result.time % 60)).padStart(2, "0")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Thời gian</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">{result.skill}%</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Điều khiển khéo léo</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button className="btn-primary" onClick={replay}>
                ↺ Chèo một lượt nữa
              </button>
              <button className="btn-outline" onClick={backToMenu}>
                ⌂ Về màn hình đầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
