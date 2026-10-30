import { useRef, useState } from "react";
import { DragonEngine, ROUND_TIME, type DragonEvent } from "@/game/dragon/engine";
import { drawDragonStage } from "@/game/dragon/render";
import { GameAudio } from "@/game/audio";
import {
  BackToHub,
  GameIntro,
  LedgerReceipt,
  StageCanvas,
  TeuSays,
  useKeys,
  useStageLoop,
} from "./stage";

type Phase = "intro" | "playing" | "paused" | "result";

const INTRO =
  "Mùa khô hanh, lửa rình rập đình chùa! Mô hình FL-1 báo trước chỗ nào sắp cháy — cho rồng phun nước tưới ướt ngay khi thấy vòng cảnh báo vàng nhé!";

const LINES: Record<DragonEvent, string> = {
  warn: "FL-1 cảnh báo! Vòng vàng đang nháy — bơi tới tưới ướt trước khi lửa bén!",
  ignite: "Lửa bén rồi! Phun nước dập ngay kẻo cháy lan!",
  prevented: "Giỏi quá! Tưới trước nên lửa không bén được — cảnh báo sớm đáng giá thế đấy!",
  extinguished: "Dập tắt rồi! Rồng ta phun nước khéo ghê!",
  spread: "Úi, lửa to bắt sang nhà bên cạnh! Nhanh lên!",
  lost: "Ôi… một công trình đã sập. Giữ lấy những nơi còn lại!",
  end: "",
};

export default function DragonGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [line, setLine] = useState(INTRO);
  const [hud, setHud] = useState({ time: ROUND_TIME, water: 1, standing: 5, prevented: 0 });
  const [result, setResult] = useState({ won: false, score: 0, standing: 0, prevented: 0, out: 0 });
  const [muted, setMuted] = useState(false);
  const [round, setRound] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engine = useRef(new DragonEngine());
  const audio = useRef<GameAudio | null>(null);
  const touch = useRef({ left: false, right: false, spray: false });
  const hudAt = useRef(0);

  const keys = useKeys((k) => {
    if (k === "p" || k === "P" || k === "Escape") {
      setPhase((p) => (p === "playing" ? "paused" : p === "paused" ? "playing" : p));
    }
  });

  const sfx = () => (audio.current ??= new GameAudio());

  useStageLoop(canvasRef, phase === "playing", (dt, ctx) => {
    const e = engine.current;
    const k = keys.current;
    const t = touch.current;
    const left = k.has("arrowleft") || k.has("a") || t.left;
    const right = k.has("arrowright") || k.has("d") || t.right;
    e.update(dt, {
      moveAxis: (right ? 1 : 0) - (left ? 1 : 0),
      sprayHeld: k.has(" ") || t.spray,
    });
    for (const ev of e.events.splice(0)) {
      const a = sfx();
      if (ev === "warn") a.bite();
      else if (ev === "ignite" || ev === "spread") a.thud();
      else if (ev === "prevented") a.goal();
      else if (ev === "extinguished") a.splash();
      else if (ev === "lost") a.thud();
      if (ev === "end") {
        const won = e.won();
        if (won) a.win();
        setResult({
          won,
          score: e.score(),
          standing: e.standing(),
          prevented: e.prevented,
          out: e.extinguished,
        });
        setLine(
          won
            ? "Tết Tết Tết! Đình chùa còn nguyên, cảm ơn khán giả đã giữ lửa không bén!"
            : "Mất nhiều công trình quá… Ta diễn lại, lần này canh vòng cảnh báo sớm hơn nhé!",
        );
        window.setTimeout(() => setPhase("result"), 1200);
      } else {
        setLine(LINES[ev]);
      }
    }
    const now = performance.now();
    if (now - hudAt.current > 150) {
      hudAt.current = now;
      setHud({ time: e.timeLeft, water: e.water, standing: e.standing(), prevented: e.prevented });
    }
    drawDragonStage(ctx, e);
  });

  const start = () => {
    engine.current.reset(20260325 + round * 7919);
    setRound((r) => r + 1);
    setLine(INTRO);
    const a = sfx();
    a.setMuted(muted);
    a.start();
    setPhase("playing");
  };

  const hold = (key: "left" | "right" | "spray") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      touch.current[key] = true;
    },
    onPointerUp: () => {
      touch.current[key] = false;
    },
    onPointerLeave: () => {
      touch.current[key] = false;
    },
  });

  const playing = phase === "playing" || phase === "paused";

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-3 py-4 sm:py-6">
      {phase === "intro" && (
        <GameIntro
          badge="🐉 Tích múa rồng · HeriTrust FL-1"
          title="Rồng Phun Nước Giữ Đình"
          lead="Điều khiển rồng rối bơi dọc ao, phun nước dập lửa và tưới ướt những công trình mà mô hình dự báo rủi ro đang cảnh báo. Giữ ít nhất 3/5 công trình đứng vững trong 75 giây."
          teu={INTRO}
          steps={[
            {
              icon: "⚠️",
              title: "Vòng cảnh báo vàng",
              desc: "FL-1 báo trước 2–3 giây nơi sắp cháy, kèm mức rủi ro dự báo.",
            },
            {
              icon: "💦",
              title: "Tưới trước khi cháy",
              desc: "Phun nước vào nơi đang cảnh báo để chặn lửa — được điểm phòng ngừa.",
            },
            {
              icon: "🔥",
              title: "Dập lửa",
              desc: "Lửa để lâu sẽ to dần, làm hỏng công trình và bắt sang nhà bên.",
            },
            {
              icon: "🫧",
              title: "Nước có hạn",
              desc: "Phun liên tục sẽ cạn; thả nút cho rồng ngụp xuống ao lấy nước.",
            },
          ]}
          controls="Bàn phím: ← → bơi, giữ Space để phun nước, P tạm dừng. Điện thoại: giữ các nút dưới sân khấu."
          link="Tháng 3/2025 cháy rừng ở Hàn Quốc làm hư hại 30 di tích; nhờ được báo trước, 15 hiện vật kịp sơ tán. HeriTrust huấn luyện liên kết mô hình rủi ro FL-1 giữa Việt Nam và Hàn Quốc mà dữ liệu gốc không rời khỏi mỗi nước."
          onStart={start}
        />
      )}

      {playing && (
        <div className="relative w-full max-w-5xl">
          <StageCanvas canvasRef={canvasRef}>
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
              <div className="signboard text-sm text-foreground">
                <span className="font-display font-bold text-gold">⏱ {Math.ceil(hud.time)}s</span>
                <span className="ml-3">🏯 {hud.standing}/5 đứng vững</span>
                <span className="ml-3">🛡 {hud.prevented} lần chặn trước</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip">💧 Nước</span>
                <div className="h-3 w-32 overflow-hidden rounded-full bg-card/80">
                  <div
                    className="h-full rounded-full bg-teal transition-[width]"
                    style={{ width: `${Math.round(hud.water * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="absolute right-3 top-3 flex gap-2">
              <button
                className="btn-icon"
                onClick={() => {
                  setMuted(!muted);
                  sfx().setMuted(!muted);
                }}
                aria-label="Bật tắt âm thanh"
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <button className="btn-icon" onClick={() => setPhase("paused")} aria-label="Tạm dừng">
                ⏸
              </button>
            </div>
            <TeuSays line={line} />
          </StageCanvas>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <button className="touchpad" {...hold("left")} aria-label="Bơi sang trái">
              ◀
            </button>
            <button className="touchpad" {...hold("right")} aria-label="Bơi sang phải">
              ▶
            </button>
            <button className="touchpad-sm h-16" {...hold("spray")} aria-label="Phun nước">
              💦 Giữ để phun
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Bàn phím: ← → bơi · giữ Space phun nước · P tạm dừng
          </p>
        </div>
      )}

      {phase === "paused" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6">
            <h2 className="text-center font-display text-2xl font-bold text-gold">Nghỉ giải lao</h2>
            <div className="mt-5 flex flex-col gap-2">
              <button className="btn-primary" onClick={() => setPhase("playing")}>
                ▶ Tiếp tục
              </button>
              <button className="btn-gold" onClick={start}>
                ↺ Diễn lại từ đầu
              </button>
              <BackToHub />
            </div>
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6 text-center">
            <p className="text-5xl">{result.won ? "🐉 🎉 🏯" : "🐉 💧 🔥"}</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-gold">
              {result.won ? "Giữ được đình làng!" : "Lửa thắng lần này"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{line}</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">{result.standing}/5</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Còn đứng vững</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">{result.prevented}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Chặn nhờ cảnh báo</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">{result.score}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Điểm bảo tồn</p>
              </div>
            </div>
            {result.won && (
              <LedgerReceipt
                game="Rồng Phun Nước Giữ Đình"
                code="FL1"
                title="Báo cáo bảo vệ di tích"
                summary={`${result.standing}/5 công trình còn nguyên, ${result.prevented} lần chặn nhờ cảnh báo FL-1`}
                payload={result}
              />
            )}
            <div className="mt-5 flex flex-col gap-2">
              <button className="btn-primary" onClick={start}>
                ↺ Diễn thêm một lượt
              </button>
              <BackToHub />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
