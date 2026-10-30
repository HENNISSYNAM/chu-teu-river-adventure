import { useEffect, useRef, useState } from "react";
import { ARTIFACTS, DIFFS_PER_ROUND, ROUND_TIME, VerifyEngine } from "@/game/verify/engine";
import { drawVerifyStage } from "@/game/verify/render";
import { GameAudio } from "@/game/audio";
import { sha256Hex, shortHash } from "@/lib/ledger";
import {
  BackToHub,
  GameIntro,
  LedgerReceipt,
  StageCanvas,
  TeuSays,
  stagePoint,
  useKeys,
  useStageLoop,
} from "./stage";

type Phase = "intro" | "playing" | "result";

const INTRO =
  "Có kẻ dùng AI vẽ lại di sản rồi tung lên mạng, nhìn thì giống mà sai be bét! Bên trái là bản ghi gốc đã được ký duyệt, bên phải là ảnh lan truyền — chỉ ra ba chỗ sai giúp Tễu nào!";

export default function VerifyGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [line, setLine] = useState(INTRO);
  const [hud, setHud] = useState({
    round: 0,
    found: 0,
    time: ROUND_TIME,
    score: 0,
    cleared: false,
  });
  const [hashes, setHashes] = useState({ original: "", circulating: "" });
  const [labels, setLabels] = useState<string[]>([]);
  const [result, setResult] = useState({ score: 0, accuracy: 0, misses: 0, hints: 0 });
  const [muted, setMuted] = useState(false);
  const [seed, setSeed] = useState(20260608);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engine = useRef(new VerifyEngine());
  const audio = useRef<GameAudio | null>(null);
  const hudAt = useRef(0);
  const sfx = () => (audio.current ??= new GameAudio());

  useKeys((k) => {
    if (k === "h" || k === "H") engine.current.hint();
    if ((k === "Enter" || k === " ") && engine.current.cleared) next();
  });

  // mã băm của bản gốc và ảnh lan truyền cho vòng hiện tại: khác nhau dù trông giống
  useEffect(() => {
    if (phase !== "playing") return;
    const e = engine.current;
    const a = e.artifact();
    let live = true;
    void Promise.all([
      sha256Hex(JSON.stringify({ id: a.id, distorted: [] })),
      sha256Hex(JSON.stringify({ id: a.id, distorted: [...e.distorted].sort() })),
    ]).then(([original, circulating]) => {
      if (live) setHashes({ original, circulating });
    });
    return () => {
      live = false;
    };
  }, [phase, hud.round]);

  useStageLoop(canvasRef, phase === "playing", (dt, ctx) => {
    const e = engine.current;
    e.update(dt);
    for (const ev of e.events.splice(0)) {
      const a = sfx();
      switch (ev) {
        case "found": {
          a.bite();
          const p = e.part(e.found.at(-1) ?? "");
          if (p) setLine(`Đúng rồi! ${p.label}.`);
          break;
        }
        case "miss":
          a.drop();
          setLine("Chỗ này vẫn khớp bản gốc mà. Nhìn kỹ lại nào!");
          break;
        case "hint":
          setLine("Tễu khoanh vùng nghi vấn rồi đấy — nhìn ô nét đứt vàng!");
          break;
        case "round-clear":
          a.caught();
          setLine(
            "Đủ ba chỗ sai! Mã băm hai ảnh khác nhau — ảnh lan truyền không phải bản được ký duyệt.",
          );
          break;
        case "timeout":
          a.thud();
          setLine("Hết giờ rồi! Tễu khoanh hộ những chỗ còn lại, sang bức sau nhé.");
          break;
        case "finish":
          a.win();
          setResult({
            score: e.score,
            accuracy: e.accuracy(),
            misses: e.totalMisses,
            hints: e.hintsUsed,
          });
          window.setTimeout(() => setPhase("result"), 600);
          break;
      }
    }
    const now = performance.now();
    if (now - hudAt.current > 150) {
      hudAt.current = now;
      setHud({
        round: e.round,
        found: e.found.length,
        time: e.timeLeft,
        score: e.score,
        cleared: e.cleared,
      });
      setLabels(e.found.map((id) => e.part(id)?.label ?? ""));
    }
    drawVerifyStage(ctx, e);
  });

  const start = () => {
    engine.current.reset(seed);
    setSeed((s) => s + 104729);
    setLine(INTRO);
    setLabels([]);
    const a = sfx();
    a.setMuted(muted);
    a.start();
    setPhase("playing");
  };

  function next() {
    const e = engine.current;
    e.nextRound();
    if (!e.finished) setLine(`Bức tiếp theo: ${e.artifact().name}. Tìm ba chỗ AI vẽ sai!`);
  }

  const onTap = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = stagePoint(ev);
    engine.current.tap(x, y);
  };

  const art = ARTIFACTS[hud.round] ?? ARTIFACTS[0]!;
  const last = hud.round >= ARTIFACTS.length - 1;

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-3 py-4 sm:py-6">
      {phase === "intro" && (
        <GameIntro
          badge="🔍 Tích thẩm định · HeriTrust FL-2"
          title="Tễu Thẩm Định"
          lead="Ba bức tranh di sản — thủy đình, con rối chú Tễu, Khuê Văn Các — đã bị AI vẽ lại sai lệch. So với bản ghi gốc có HeriID, chạm vào đúng ba chỗ sai trong mỗi bức."
          teu={INTRO}
          steps={[
            {
              icon: "✅",
              title: "Bản ghi gốc",
              desc: "Đã được người giữ gìn di sản ký duyệt và neo mã băm lên sổ cái.",
            },
            {
              icon: "⚠️",
              title: "Ảnh lan truyền",
              desc: "Mô hình FL-2 nghi ảnh do AI làm sai lệch; bạn là người xác nhận cuối.",
            },
            {
              icon: "👆",
              title: "Chạm vào chỗ sai",
              desc: "Chạm ở bức nào cũng được. Chạm nhầm bị trừ điểm.",
            },
            {
              icon: "💡",
              title: "Gợi ý",
              desc: "Nút gợi ý (phím H) khoanh vùng một chỗ sai, đổi lại bị trừ 30 điểm.",
            },
          ]}
          controls="Chuột hoặc ngón tay: chạm vào chỗ sai. H: gợi ý. Enter: sang bức tiếp theo khi xong."
          link="Hơn 65% văn bản về di sản do năm mô hình ngôn ngữ mở tạo ra có sai lệch văn hóa. HeriTrust cho trường học, nhà phát triển game và AI đối chiếu ảnh, mô hình 3D với bản ghi đã ký duyệt — miễn phí, không cần tài khoản."
          onStart={start}
        />
      )}

      {phase === "playing" && (
        <div className="relative w-full max-w-5xl">
          <StageCanvas canvasRef={canvasRef} onPointerDown={onTap}>
            <div className="pointer-events-none absolute left-3 top-3">
              <div className="signboard text-sm text-foreground">
                <span className="font-display font-bold text-gold">
                  Bức {hud.round + 1}/{ARTIFACTS.length}
                </span>
                <span className="ml-3">
                  🔍 {hud.found}/{DIFFS_PER_ROUND}
                </span>
                <span className="ml-3">⏱ {Math.ceil(hud.time)}s</span>
                <span className="ml-3">⭐ {hud.score}</span>
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
            </div>
            <TeuSays line={line} />
          </StageCanvas>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              className="btn-outline"
              onClick={() => engine.current.hint()}
              disabled={hud.cleared}
            >
              💡 Gợi ý (−30)
            </button>
            {hud.cleared && (
              <button className="btn-primary" onClick={next}>
                {last ? "🏁 Xem kết quả" : "Bức tiếp theo →"}
              </button>
            )}
          </div>

          <div className="panel mt-3 grid gap-3 p-4 text-xs sm:grid-cols-2">
            <div>
              <p className="font-display text-sm font-bold text-gold">{art.name}</p>
              <p className="mt-1 text-muted-foreground">Người giữ gìn: {art.custodian}</p>
              <p className="mt-2 font-mono">
                <span className="text-muted-foreground">Băm bản gốc · </span>
                <span className="text-foreground">
                  {hashes.original ? shortHash(hashes.original) : "…"}
                </span>
              </p>
              <p className="font-mono">
                <span className="text-muted-foreground">Băm ảnh lan truyền · </span>
                <span className="text-destructive">
                  {hashes.circulating ? shortHash(hashes.circulating) : "…"}
                </span>
              </p>
            </div>
            <div>
              <p className="font-display text-sm font-bold text-gold">Chỗ sai đã chỉ ra</p>
              {labels.length ? (
                <ul className="mt-1 list-disc pl-4 text-foreground">
                  {labels.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted-foreground">Chưa có — hãy so kỹ hai bức tranh.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6 text-center">
            <p className="text-5xl">🔍 🎭 ✅</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-gold">Thẩm định xong!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              “Ảnh đẹp chưa chắc đã thật — phải đối chiếu bản ghi gốc!” — chú Tễu dặn khán giả.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">{result.accuracy}%</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Độ chính xác</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">{result.misses}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Chạm nhầm</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="font-display text-2xl font-bold text-gold">{result.score}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Điểm</p>
              </div>
            </div>
            <LedgerReceipt
              game="Tễu Thẩm Định"
              code="FL2"
              title="Biên bản thẩm định ảnh lan truyền"
              summary={`Phát hiện sai lệch trên ${ARTIFACTS.length} bức, độ chính xác ${result.accuracy}%`}
              payload={result}
            />
            <div className="mt-5 flex flex-col gap-2">
              <button className="btn-primary" onClick={start}>
                ↺ Thẩm định lượt mới
              </button>
              <BackToHub />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
