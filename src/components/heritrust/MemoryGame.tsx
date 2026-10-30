import { useRef, useState } from "react";
import { MemoryEngine, PIECES, START_TRUST, type MemoryEvent } from "@/game/memory/engine";
import { drawMemoryStage } from "@/game/memory/render";
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
  "Bà con xa quê gửi ảnh xưa về theo hoa đăng đấy! Ta chèo thuyền vớt đủ chín mảnh để ghép lại ảnh chùa Một Cột — nhưng tránh đèn tím nhiễu sọc, đó là ảnh giả AI tạo ra!";

const LINES: Record<Exclude<MemoryEvent, "win" | "fail">, (origin: string) => string> = {
  piece: (o) => `Một mảnh ký ức gửi về từ ${o}! Cảm ơn bà con!`,
  dup: () => "Mảnh này có rồi, nhưng vẫn quý — lưu làm bản đối chứng nhé!",
  fake: () => "Ối! Ảnh giả AI lẫn vào, làm hỏng một mảnh đã ghép rồi!",
  "lost-piece": () => "Phải ghép lại mảnh vừa bị hỏng thôi. Né đèn tím ra!",
};

export default function MemoryGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [line, setLine] = useState(INTRO);
  const [hud, setHud] = useState({ count: 0, trust: START_TRUST });
  const [result, setResult] = useState({
    won: false,
    time: 0,
    dodged: 0,
    caught: 0,
    origins: [] as string[],
  });
  const [muted, setMuted] = useState(false);
  const [round, setRound] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engine = useRef(new MemoryEngine());
  const audio = useRef<GameAudio | null>(null);
  const touch = useRef({ left: false, right: false, switchEdge: false });
  const origins = useRef(new Set<string>());
  const hudAt = useRef(0);
  const sfx = () => (audio.current ??= new GameAudio());

  const keys = useKeys((k) => {
    if (k === "ArrowUp" || k === "ArrowDown" || k === "w" || k === "s" || k === " ") {
      touch.current.switchEdge = true;
    }
    if (k === "p" || k === "P" || k === "Escape") {
      setPhase((p) => (p === "playing" ? "paused" : p === "paused" ? "playing" : p));
    }
  });

  useStageLoop(canvasRef, phase === "playing", (dt, ctx) => {
    const e = engine.current;
    const k = keys.current;
    const t = touch.current;
    const left = k.has("arrowleft") || k.has("a") || t.left;
    const right = k.has("arrowright") || k.has("d") || t.right;
    e.update(dt, {
      moveAxis: (right ? 1 : 0) - (left ? 1 : 0),
      switchPressed: t.switchEdge,
      laneTarget: -1,
    });
    t.switchEdge = false;
    for (const ev of e.events.splice(0)) {
      const a = sfx();
      if (ev === "win" || ev === "fail") {
        if (ev === "win") a.win();
        else a.thud();
        setResult({
          won: ev === "win",
          time: e.elapsed,
          dodged: e.fakesDodged,
          caught: e.fakesCaught,
          origins: [...origins.current],
        });
        setLine(
          ev === "win"
            ? "Tết Tết Tết! Ảnh xưa ghép đủ, người giữ gìn di sản đã ký duyệt. Cảm ơn bà con muôn phương!"
            : "Ảnh giả lẫn vào nhiều quá, người giữ gìn chưa thể ký duyệt. Ta vớt lại từ đầu nhé!",
        );
        window.setTimeout(() => setPhase("result"), 1400);
        continue;
      }
      if (ev === "piece") {
        a.caught();
        origins.current.add(e.lastOrigin);
      } else if (ev === "dup") a.drop();
      else if (ev === "fake") a.thud();
      setLine(LINES[ev](e.lastOrigin));
    }
    const now = performance.now();
    if (now - hudAt.current > 150) {
      hudAt.current = now;
      setHud({ count: e.count(), trust: e.trust });
    }
    drawMemoryStage(ctx, e);
  });

  const start = () => {
    engine.current.reset(20261030 + round * 15485863);
    setRound((r) => r + 1);
    origins.current.clear();
    setLine(INTRO);
    const a = sfx();
    a.setMuted(muted);
    a.start();
    setPhase("playing");
  };

  const hold = (key: "left" | "right") => ({
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
  const mins = Math.floor(result.time / 60);
  const secs = String(Math.floor(result.time % 60)).padStart(2, "0");

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-3 py-4 sm:py-6">
      {phase === "intro" && (
        <GameIntro
          badge="🪷 Tích hoa đăng · Kiều bào góp ký ức"
          title="Ghép Mảnh Ký Ức"
          lead="Chú Tễu chèo thuyền giữa hai luồng nước, vớt những mảnh ảnh xưa kiều bào gửi về theo hoa đăng để ghép lại bức ảnh chùa Một Cột, đồng thời né đèn mang ảnh giả do AI tạo."
          teu={INTRO}
          steps={[
            {
              icon: "🪷",
              title: "Hoa đăng hồng",
              desc: "Mang một mảnh ảnh thật, ghi rõ nơi gửi: Paris, Sydney, Seoul…",
            },
            {
              icon: "🟪",
              title: "Đèn tím nhiễu sọc",
              desc: "Ảnh giả AI: vớt nhầm mất một lượt tin cậy và hỏng một mảnh đã ghép.",
            },
            {
              icon: "↕️",
              title: "Đổi luồng",
              desc: "Thuyền chạy được ở luồng xa và luồng gần; đổi luồng để né hoặc đón đèn.",
            },
            {
              icon: "✍️",
              title: "Ký duyệt",
              desc: "Đủ 9 mảnh, người giữ gìn di sản ký và bản ghi được neo lên sổ cái.",
            },
          ]}
          controls="Bàn phím: ← → chèo, ↑ ↓ hoặc Space đổi luồng, P tạm dừng. Điện thoại: các nút dưới sân khấu."
          link="Hơn 6 triệu người Việt ở hơn 130 nước và khoảng 7 triệu kiều bào Hàn Quốc đang giữ ảnh gia đình, bản vẽ và ký ức về những nơi đã đổi khác. Trong HeriTrust, ảnh kiều bào gửi về là chứng cứ chưa xác minh cho tới khi người giữ gìn di sản ký duyệt."
          onStart={start}
        />
      )}

      {playing && (
        <div className="relative w-full max-w-5xl">
          <StageCanvas canvasRef={canvasRef}>
            <div className="pointer-events-none absolute right-3 top-16 flex flex-col items-end gap-2">
              <div className="signboard text-sm text-foreground">
                <span className="font-display font-bold text-gold">
                  🧩 {hud.count}/{PIECES}
                </span>
                <span className="ml-3" aria-label={`Tin cậy ${hud.trust} trên ${START_TRUST}`}>
                  {"🛡".repeat(hud.trust)}
                  <span className="opacity-30">
                    {"🛡".repeat(Math.max(0, START_TRUST - hud.trust))}
                  </span>
                </span>
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
            <button className="touchpad" {...hold("left")} aria-label="Chèo sang trái">
              ◀
            </button>
            <button className="touchpad" {...hold("right")} aria-label="Chèo sang phải">
              ▶
            </button>
            <button
              className="touchpad-sm h-16"
              onPointerDown={(e) => {
                e.preventDefault();
                touch.current.switchEdge = true;
              }}
              aria-label="Đổi luồng nước"
            >
              ↕ Đổi luồng
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Bàn phím: ← → chèo · ↑ ↓ / Space đổi luồng · P tạm dừng
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
            <p className="text-5xl">{result.won ? "🪷 🎉 🪷" : "🪷 🟪 🪷"}</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-gold">
              {result.won ? "Ký ức đã về nhà!" : "Chưa ký duyệt được"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{line}</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">
                  {mins}:{secs}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Thời gian</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">{result.dodged}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Ảnh giả đã né</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">{result.origins.length}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Nơi gửi về</p>
              </div>
            </div>
            {result.won && (
              <>
                <p className="mt-3 text-xs text-muted-foreground">
                  Mảnh ảnh gửi từ: {result.origins.join(", ")}
                </p>
                <LedgerReceipt
                  game="Ghép Mảnh Ký Ức"
                  code="KB"
                  title="Bản ghi ảnh xưa chùa Một Cột do kiều bào đóng góp"
                  summary={`9/9 mảnh từ ${result.origins.length} nơi, người giữ gìn đã ký duyệt`}
                  payload={result}
                />
              </>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <button className="btn-primary" onClick={start}>
                ↺ Vớt thêm một lượt
              </button>
              <BackToHub />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
