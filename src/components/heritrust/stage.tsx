import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { STAGE_H, STAGE_W } from "@/game/engine";
import { anchorRecord, shortHash, type LedgerRecord } from "@/lib/ledger";

/** Chạy vòng lặp requestAnimationFrame vẽ lên canvas sân khấu khi `running`. */
export function useStageLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  running: boolean,
  frame: (dt: number, ctx: CanvasRenderingContext2D) => void,
) {
  const frameRef = useRef(frame);
  frameRef.current = frame;

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = STAGE_W * dpr;
    canvas.height = STAGE_H * dpr;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      frameRef.current(dt, ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, running]);
}

/** Đổi toạ độ con trỏ trên canvas (đã co giãn) về toạ độ sân khấu 960×600. */
export function stagePoint(e: React.PointerEvent<HTMLCanvasElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * STAGE_W,
    y: ((e.clientY - r.top) / r.height) * STAGE_H,
  };
}

export function BackToHub() {
  return (
    <Link to="/" className="btn-quiet px-4 py-2 text-sm">
      ← Các tích trò
    </Link>
  );
}

export function TeuSays({ line }: { line: string }) {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-start">
      <div className="signboard max-w-[92%] sm:max-w-[70%]">
        <p className="text-sm leading-snug text-foreground sm:text-base">
          <span className="font-display font-bold text-gold">Chú Tễu: </span>
          {line}
        </p>
      </div>
    </div>
  );
}

/** Màn giới thiệu chung cho các tích trò HeriTrust. */
export function GameIntro(props: {
  badge: string;
  title: string;
  lead: string;
  teu: string;
  link: string;
  steps: { icon: string; title: string; desc: string }[];
  controls: string;
  onStart: () => void;
}) {
  return (
    <div className="w-full max-w-3xl py-6">
      <div className="mb-4">
        <BackToHub />
      </div>
      <div className="text-center">
        <p className="chip mb-3">{props.badge}</p>
        <h1 className="font-display text-4xl font-extrabold leading-tight text-gold sm:text-6xl">
          {props.title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          {props.lead}
        </p>
      </div>
      <div className="panel mt-6 p-5">
        <p className="text-sm leading-relaxed text-foreground">
          <span className="font-display text-base font-bold text-gold">Chú Tễu: </span>
          {props.teu}
        </p>
      </div>
      <div className="mt-6 flex justify-center">
        <button className="btn-primary w-full text-lg sm:w-auto" onClick={props.onStart}>
          🎭 Mở màn
        </button>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {props.steps.map((s) => (
          <div key={s.title} className="panel flex items-start gap-3 p-4">
            <span className="text-3xl leading-none">{s.icon}</span>
            <div>
              <h3 className="font-display text-sm font-bold text-gold">{s.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="panel mt-3 p-4">
        <h3 className="font-display text-sm font-bold text-gold">Điều khiển</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{props.controls}</p>
      </div>
      <div className="panel mt-3 p-4">
        <h3 className="font-display text-sm font-bold text-gold">Liên hệ với HeriTrust</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{props.link}</p>
      </div>
    </div>
  );
}

/** Neo kết quả lên sổ cái mô phỏng một lần rồi hiện biên nhận. */
export function LedgerReceipt(props: {
  game: string;
  code: string;
  title: string;
  summary: string;
  payload: unknown;
}) {
  const [rec, setRec] = useState<LedgerRecord | null>(null);
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    void anchorRecord(props).then(setRec);
  }, [props]);

  return (
    <div className="mt-4 rounded-2xl border border-gold/40 bg-secondary/50 p-4 text-left">
      <p className="font-display text-sm font-bold text-gold">⛓ Neo lên sổ cái HeriTrust</p>
      {rec ? (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">HeriID</dt>
          <dd className="font-mono text-foreground">{rec.heriId}</dd>
          <dt className="text-muted-foreground">Khối</dt>
          <dd className="font-mono text-foreground">#{rec.block}</dd>
          <dt className="text-muted-foreground">Mã băm</dt>
          <dd className="break-all font-mono text-foreground">{shortHash(rec.hash)}</dd>
          <dt className="text-muted-foreground">Khối trước</dt>
          <dd className="break-all font-mono text-muted-foreground">{shortHash(rec.prevHash)}</dd>
        </dl>
      ) : (
        <p className="mt-2 animate-pulse text-xs text-muted-foreground">Đang băm và ký…</p>
      )}
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Sổ cái mô phỏng, chỉ lưu trên trình duyệt này. Mạng thật dùng chuỗi khối liên minh FISCO
        BCOS, người chơi không phải trả phí gas.
      </p>
    </div>
  );
}

export function StageCanvas(props: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  children?: ReactNode;
  onPointerDown?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
}) {
  return (
    <div className="panel relative overflow-hidden rounded-3xl border-2 border-gold/50">
      <canvas
        ref={props.canvasRef}
        className="block w-full touch-none"
        style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}` }}
        onPointerDown={props.onPointerDown}
        onPointerMove={props.onPointerMove}
        onPointerUp={props.onPointerUp}
        onPointerCancel={props.onPointerUp}
      />
      {props.children}
    </div>
  );
}

/** Theo dõi phím đang giữ; trả về ref để vòng lặp đọc mà không render lại. */
export function useKeys(onPress?: (key: string) => void) {
  const keys = useRef(new Set<string>());
  const pressRef = useRef(onPress);
  pressRef.current = onPress;
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === " " || e.key.startsWith("Arrow")) e.preventDefault();
      if (!e.repeat) pressRef.current?.(e.key);
      keys.current.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  return keys;
}
