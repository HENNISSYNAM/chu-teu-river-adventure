import { useEffect, useRef, useState } from "react";
import { DragonEngine, type DragonEvent } from "@/game/dragon/engine";
import { drawDragonStage } from "@/game/dragon/render";
import { VerifyEngine, ARTIFACTS, DIFFS_PER_ROUND, type VerifyEvent } from "@/game/verify/engine";
import { drawVerifyStage } from "@/game/verify/render";
import { MemoryEngine, PIECES, type MemoryEvent } from "@/game/memory/engine";
import { drawMemoryStage } from "@/game/memory/render";
import { drawAudience, drawBackdrop, drawPavilion, drawWaterSurface } from "@/game/render";
import {
  dragonPilot,
  memoryPilot,
  verifyPilot,
  type VerifyPilotState,
} from "@/game/demo/autopilot";
import { GameAudio } from "@/game/audio";
import { anchorRecord, shortHash, type LedgerRecord } from "@/lib/ledger";
import castRow from "@/assets/heritrust/cast-row.webp";
import { BackToHub, StageCanvas, TeuSays, useKeys, useStageLoop } from "./stage";

// Trình diễn tự động cho buổi thuyết trình: các tích trò tự chạy nối tiếp nhau,
// người thuyết trình chỉ cần bấm Space (dừng), ← → (chuyển cảnh), F (toàn màn hình).

type SceneId = "intro" | "dragon" | "verify" | "memory" | "outro";
const ORDER: SceneId[] = ["intro", "dragon", "verify", "memory", "outro"];
const CARD_TIME = 8;
const DEMO_DRAGON_TIME = 40;

const SCENES: Record<SceneId, { badge: string; title: string; idea: string; teu: string }> = {
  intro: {
    badge: "HeriTrust · KMAC 2026",
    title: "Chú Tễu kể chuyện giữ di sản",
    idea: "Mạng chuỗi khối liên minh và học liên kết Việt Nam – Hàn Quốc, kể lại bằng múa rối nước.",
    teu: "Kính thưa khán giả! Đêm nay Tễu xin diễn ba tích trò, mỗi tích kể một phần của HeriTrust!",
  },
  dragon: {
    badge: "Tích 1 · FL-1 Rủi ro và thiên tai",
    title: "Rồng Phun Nước Giữ Đình",
    idea: "Mô hình rủi ro học liên kết báo trước nơi sắp cháy — tưới trước thì lửa không bén.",
    teu: "Vòng vàng là cảnh báo FL-1 đấy! Rồng ta bơi tới tưới ướt trước khi lửa bén!",
  },
  verify: {
    badge: "Tích 2 · FL-2 Nội dung AI sai lệch",
    title: "Tễu Thẩm Định",
    idea: "Đối chiếu ảnh lan truyền với bản ghi gốc đã ký duyệt: sai một chi tiết là mã băm khác ngay.",
    teu: "Ảnh trên mạng trông giống mà sai be bét! Tễu chỉ cho khán giả từng chỗ AI vẽ sai nhé!",
  },
  memory: {
    badge: "Tích 3 · Lớp cộng đồng kiều bào",
    title: "Ghép Mảnh Ký Ức",
    idea: "Kiều bào gửi ảnh xưa về; ảnh giả bị loại; đủ chứng cứ thì người giữ gìn ký duyệt.",
    teu: "Hoa đăng chở ảnh xưa từ khắp nơi về đấy! Tễu vớt mảnh thật, né đèn tím ảnh giả!",
  },
  outro: {
    badge: "Sổ cái HeriTrust",
    title: "Một bản ghi ai cũng kiểm chứng được",
    idea: "Mỗi tích trò vừa diễn đã được băm và neo thành một khối, nối chuỗi với khối trước.",
    teu: "Tết Tết Tết! Cảm ơn khán giả đã xem Tễu diễn — di sản thật thì phải kiểm chứng được!",
  },
};

const DRAGON_LINES: Partial<Record<DragonEvent, string>> = {
  warn: "FL-1 cảnh báo! Rồng bơi tới tưới trước nào!",
  prevented: "Chặn được rồi! Cảnh báo sớm đáng giá thế đấy!",
  ignite: "Lửa bén mất một chỗ, phun nước ngay!",
  extinguished: "Dập tắt rồi! Đình chùa còn nguyên!",
};
const MEMORY_LINES: Partial<Record<MemoryEvent, (o: string) => string>> = {
  piece: (o) => `Một mảnh ký ức gửi về từ ${o}!`,
  fake: () => "Ối, lẫn ảnh giả rồi!",
};

export default function Showcase() {
  const [started, setStarted] = useState(false);
  const [scene, setScene] = useState<SceneId>("intro");
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [line, setLine] = useState(SCENES.intro.teu);
  const [status, setStatus] = useState("");
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [chrome, setChrome] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const audio = useRef<GameAudio | null>(null);
  const dragon = useRef(new DragonEngine());
  const verify = useRef(new VerifyEngine());
  const verifyState = useRef<VerifyPilotState>({ wait: 1 });
  const memory = useRef(new MemoryEngine());
  const sceneT = useRef(0);
  const sceneRef = useRef<SceneId>("intro");
  const ended = useRef(false);
  const statusAt = useRef(0);
  const round = useRef(0);
  const sfx = () => (audio.current ??= new GameAudio());

  const enter = (id: SceneId) => {
    sceneT.current = 0;
    ended.current = false;
    const r = round.current;
    if (id === "intro") {
      round.current += 1;
      setRecords([]);
    }
    if (id === "dragon") {
      dragon.current.reset(20260325 + r * 7919);
      dragon.current.timeLeft = DEMO_DRAGON_TIME;
    }
    if (id === "verify") {
      verify.current.reset(20260608 + r * 104729);
      verifyState.current = { wait: 1.5 };
    }
    if (id === "memory") memory.current.reset(20261030 + r * 15485863);
    sceneRef.current = id;
    setScene(id);
    setLine(SCENES[id].teu);
    setStatus("");
  };

  const go = (step: number) => {
    const i = ORDER.indexOf(sceneRef.current);
    enter(ORDER[(i + step + ORDER.length) % ORDER.length] ?? "intro");
  };

  const toggleFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  };

  const start = () => {
    const a = sfx();
    a.setMuted(muted);
    a.start();
    setStarted(true);
    enter("intro");
    toggleFullscreen();
  };

  useKeys((k) => {
    if (!started) {
      if (k === "Enter" || k === " ") start();
      return;
    }
    if (k === " ") setPaused((p) => !p);
    else if (k === "ArrowRight") go(1);
    else if (k === "ArrowLeft") go(-1);
    else if (k === "f" || k === "F") toggleFullscreen();
    else if (k === "m" || k === "M") {
      setMuted((m) => {
        sfx().setMuted(!m);
        return !m;
      });
    } else if (k === "1" || k === "2" || k === "3")
      setSpeed(Number(k) === 1 ? 1 : Number(k) === 2 ? 1.5 : 2);
    else if (k === "h" || k === "H") setChrome((c) => !c);
  });

  // ẩn thanh điều khiển sau vài giây không động chuột
  useEffect(() => {
    if (!started) return;
    let timer = window.setTimeout(() => setChrome(false), 3500);
    const wake = () => {
      setChrome(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setChrome(false), 3500);
    };
    window.addEventListener("pointermove", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
    };
  }, [started]);

  const finishScene = (id: SceneId, title: string, summary: string, payload: unknown) => {
    if (ended.current) return;
    ended.current = true;
    void anchorRecord({
      game: SCENES[id].title,
      code: id.toUpperCase().slice(0, 3),
      title,
      summary,
      payload,
    }).then((rec) => setRecords((list) => [...list, rec]));
    // người thuyết trình có thể đã tự chuyển cảnh trong lúc chờ
    window.setTimeout(() => {
      if (sceneRef.current === id) go(1);
    }, 2500);
  };

  useStageLoop(canvasRef, started && !paused, (rawDt, ctx) => {
    const dt = rawDt * speed;
    sceneT.current += dt;
    const now = performance.now();
    const pushStatus = (s: string) => {
      if (now - statusAt.current > 200) {
        statusAt.current = now;
        setStatus(s);
      }
    };

    switch (scene) {
      case "intro":
      case "outro": {
        drawBackdrop(ctx, sceneT.current, "HERITRUST", "MÚA RỐI NƯỚC · VIỆT NAM – HÀN QUỐC");
        drawWaterSurface(ctx, sceneT.current);
        drawPavilion(ctx, sceneT.current);
        drawAudience(ctx);
        const limit = scene === "outro" ? CARD_TIME + 4 : CARD_TIME;
        if (sceneT.current > limit && !ended.current) {
          ended.current = true;
          go(1);
        }
        break;
      }
      case "dragon": {
        const e = dragon.current;
        e.update(dt, dragonPilot(e));
        for (const ev of e.events.splice(0)) {
          if (ev === "warn") sfx().bite();
          if (ev === "prevented") sfx().goal();
          if (ev === "extinguished") sfx().splash();
          const l = DRAGON_LINES[ev];
          if (l) setLine(l);
          if (ev === "end") {
            sfx().win();
            finishScene(
              "dragon",
              "Báo cáo bảo vệ di tích",
              `${e.standing()}/5 công trình còn nguyên, ${e.prevented} lần chặn nhờ FL-1`,
              { standing: e.standing(), prevented: e.prevented },
            );
          }
        }
        pushStatus(
          `⏱ ${Math.ceil(e.timeLeft)}s · 🏯 ${e.standing()}/5 · 🛡 ${e.prevented} lần chặn trước`,
        );
        drawDragonStage(ctx, e);
        break;
      }
      case "verify": {
        const e = verify.current;
        verifyPilot(e, verifyState.current, dt);
        e.update(dt);
        for (const ev of e.events.splice(0) as VerifyEvent[]) {
          if (ev === "found") {
            sfx().bite();
            const p = e.part(e.found.at(-1) ?? "");
            if (p) setLine(`Chỗ sai: ${p.label}.`);
          }
          if (ev === "round-clear") {
            sfx().caught();
            setLine(
              "Đủ ba chỗ sai — mã băm hai ảnh khác nhau, ảnh lan truyền không phải bản đã ký!",
            );
          }
          if (ev === "finish") {
            sfx().win();
            finishScene(
              "verify",
              "Biên bản thẩm định ảnh lan truyền",
              `Phát hiện ${ARTIFACTS.length * DIFFS_PER_ROUND} chỗ sai trên ${ARTIFACTS.length} bức`,
              { accuracy: e.accuracy() },
            );
          }
        }
        pushStatus(
          `Bức ${Math.min(e.round + 1, ARTIFACTS.length)}/${ARTIFACTS.length} · ${e.artifact().name} · 🔍 ${e.found.length}/${DIFFS_PER_ROUND}`,
        );
        drawVerifyStage(ctx, e);
        break;
      }
      case "memory": {
        const e = memory.current;
        e.update(dt, memoryPilot(e));
        for (const ev of e.events.splice(0)) {
          if (ev === "piece") sfx().caught();
          const l = MEMORY_LINES[ev];
          if (l) setLine(l(e.lastOrigin));
          if (ev === "win" || ev === "fail") {
            sfx().win();
            setLine("Đủ chín mảnh — người giữ gìn di sản đã ký duyệt bản ghi!");
            finishScene(
              "memory",
              "Ảnh xưa chùa Một Cột do kiều bào đóng góp",
              `${e.count()}/${PIECES} mảnh, ${e.fakesDodged} ảnh giả bị loại`,
              { pieces: e.count(), dodged: e.fakesDodged },
            );
          }
        }
        pushStatus(`🧩 ${e.count()}/${PIECES} mảnh · 🟪 ${e.fakesDodged} ảnh giả đã né`);
        drawMemoryStage(ctx, e);
        break;
      }
    }
  });

  const info = SCENES[scene];
  const card = scene === "intro" || scene === "outro";

  return (
    <div
      ref={rootRef}
      className={`flex min-h-screen flex-col items-center justify-center bg-background px-3 py-4 ${
        chrome || !started ? "" : "cursor-none"
      }`}
    >
      {!started ? (
        <div className="w-full max-w-3xl text-center">
          <div className="mb-4 text-left">
            <BackToHub />
          </div>
          <p className="chip mb-3">🎭 Chế độ trình diễn</p>
          <h1 className="font-display text-4xl font-extrabold text-gold sm:text-6xl">
            Tễu tự diễn, bạn chỉ việc thuyết trình
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Ba tích trò tự chạy nối tiếp nhau trong khoảng hai phút, có lời dẫn của chú Tễu và dòng
            giải thích HeriTrust, rồi quay lại từ đầu. Hợp để chiếu lên màn hình lớn.
          </p>
          <button className="btn-primary mt-6 text-lg" onClick={start}>
            ▶ Bắt đầu trình diễn (toàn màn hình)
          </button>
          <div className="panel mx-auto mt-6 max-w-md p-4 text-left text-sm">
            <p className="font-display font-bold text-gold">Phím tắt khi trình diễn</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                <b className="text-foreground">Space</b> dừng / chạy tiếp
              </li>
              <li>
                <b className="text-foreground">← →</b> lùi / sang cảnh
              </li>
              <li>
                <b className="text-foreground">1 · 2 · 3</b> tốc độ 1× · 1,5× · 2×
              </li>
              <li>
                <b className="text-foreground">F</b> toàn màn hình ·{" "}
                <b className="text-foreground">M</b> tắt tiếng ·{" "}
                <b className="text-foreground">H</b> ẩn/hiện chú thích
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-[min(100%,calc((100vh-2rem)*1.6))]">
          <StageCanvas canvasRef={canvasRef}>
            {/* nhãn tích trò + ý tưởng HeriTrust */}
            <div className="pointer-events-none absolute left-3 top-3 max-w-[60%]">
              <div className="signboard">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {info.badge}
                </p>
                <p className="font-display text-lg font-bold text-gold sm:text-2xl">{info.title}</p>
                {chrome && <p className="mt-1 text-xs text-foreground sm:text-sm">{info.idea}</p>}
              </div>
              {status && !card && <p className="chip mt-2">{status}</p>}
            </div>

            {scene === "intro" && (
              <div className="pointer-events-none absolute inset-x-0 top-[34%] flex justify-center px-6">
                <div className="w-full max-w-2xl rounded-2xl bg-[#fbf8f1]/95 p-3 shadow-2xl">
                  <img
                    src={castRow}
                    alt="Bốn con rối nước: chú Tễu, cá chép, rồng, trâu"
                    className="h-auto w-full"
                  />
                </div>
              </div>
            )}

            {scene === "outro" && (
              <div className="pointer-events-none absolute inset-x-0 top-[30%] flex justify-center px-6">
                <div className="panel w-full max-w-2xl p-4">
                  <p className="font-display text-sm font-bold text-gold">
                    ⛓ Các khối vừa neo trong buổi diễn
                  </p>
                  <ul className="mt-2 divide-y divide-border text-xs sm:text-sm">
                    {records.map((r) => (
                      <li key={r.hash} className="flex justify-between gap-3 py-1.5">
                        <span>
                          <span className="font-mono text-gold">{r.heriId}</span> {r.summary}
                        </span>
                        <span className="shrink-0 font-mono text-muted-foreground">
                          #{r.block} {shortHash(r.hash)}
                        </span>
                      </li>
                    ))}
                    {!records.length && (
                      <li className="py-1.5 text-muted-foreground">Chưa có khối nào.</li>
                    )}
                  </ul>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Sổ cái mô phỏng trên trình duyệt; mạng thật dùng chuỗi khối liên minh FISCO
                    BCOS.
                  </p>
                </div>
              </div>
            )}

            {paused && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                <span className="signboard font-display text-2xl font-bold text-gold">
                  ⏸ Tạm dừng
                </span>
              </div>
            )}

            <TeuSays line={line} />
          </StageCanvas>

          {/* thanh điều khiển tự ẩn */}
          <div
            className={`mt-3 flex flex-wrap items-center justify-center gap-2 transition-opacity ${
              chrome ? "opacity-100" : "opacity-0"
            }`}
          >
            <button className="btn-icon" onClick={() => go(-1)} aria-label="Cảnh trước">
              ⏮
            </button>
            <button
              className="btn-icon"
              onClick={() => setPaused((p) => !p)}
              aria-label="Dừng hoặc chạy"
            >
              {paused ? "▶" : "⏸"}
            </button>
            <button className="btn-icon" onClick={() => go(1)} aria-label="Cảnh sau">
              ⏭
            </button>
            {ORDER.map((id) => (
              <button
                key={id}
                className={`chip ${scene === id ? "bg-gold text-gold-foreground" : ""}`}
                onClick={() => enter(id)}
              >
                {SCENES[id].title}
              </button>
            ))}
            <button className="chip" onClick={() => setSpeed((s) => (s >= 2 ? 1 : s + 0.5))}>
              {speed}×
            </button>
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
            <button className="btn-icon" onClick={toggleFullscreen} aria-label="Toàn màn hình">
              ⛶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
