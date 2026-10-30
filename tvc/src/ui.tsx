import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/EBGaramond";
import { loadFont as loadBody } from "@remotion/google-fonts/BeVietnamPro";

export const { fontFamily: DISPLAY } = loadDisplay("normal", {
  weights: ["600", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
});
export const { fontFamily: BODY } = loadBody("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
});

export const C = {
  ink: "#14213D",
  paper: "#F6F1E6",
  red: "#B5322A",
  gold: "#D9A441",
  mist: "#C9D1E0",
};

export function useVertical() {
  const { width, height } = useVideoConfig();
  return height > width;
}

/** Ảnh nền phóng chậm kiểu Ken Burns, mờ dần vào và ra ở hai đầu cảnh. */
export function KenBurns(props: {
  src: string;
  duration: number;
  from?: number;
  to?: number;
  originX?: string;
  originY?: string;
  fit?: "cover" | "contain";
  background?: string;
}) {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, props.duration], [props.from ?? 1.04, props.to ?? 1.14], {
    easing: Easing.inOut(Easing.quad),
  });
  const opacity = interpolate(frame, [0, 12, props.duration - 12, props.duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity, background: props.background ?? C.ink, overflow: "hidden" }}>
      <Img
        src={staticFile(props.src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: props.fit ?? "cover",
          transform: `scale(${scale})`,
          transformOrigin: `${props.originX ?? "50%"} ${props.originY ?? "50%"}`,
        }}
      />
    </AbsoluteFill>
  );
}

/** Lớp phủ tối để chữ đọc rõ trên ảnh. */
export function Scrim({ side = "bottom" }: { side?: "bottom" | "left" | "full" }) {
  const bg =
    side === "left"
      ? `linear-gradient(90deg, ${C.ink}f0 0%, ${C.ink}b0 45%, ${C.ink}00 80%)`
      : side === "full"
        ? `${C.ink}a8`
        : `linear-gradient(0deg, ${C.ink}f2 0%, ${C.ink}99 40%, ${C.ink}00 70%)`;
  return <AbsoluteFill style={{ background: bg }} />;
}

/** Hiện dần từ dưới lên theo lò xo, trễ `delay` khung hình. */
export function Rise(props: { delay?: number; children: ReactNode; distance?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - (props.delay ?? 0), fps, config: { damping: 200 } });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * (props.distance ?? 40)}px)`,
      }}
    >
      {props.children}
    </div>
  );
}

/** Tiêu đề tiếng Anh kèm phụ đề tiếng Việt. */
export function Caption(props: {
  eyebrow?: string;
  title: string;
  vi: string;
  delay?: number;
  align?: "left" | "center";
  maxWidth?: number;
}) {
  const vertical = useVertical();
  const d = props.delay ?? 8;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: vertical ? 24 : 18,
        textAlign: props.align ?? "left",
        alignItems: props.align === "center" ? "center" : "flex-start",
        maxWidth: props.maxWidth ?? (vertical ? 920 : 1100),
      }}
    >
      {props.eyebrow && (
        <Rise delay={d}>
          <div
            style={{
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: vertical ? 34 : 28,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: C.gold,
            }}
          >
            {props.eyebrow}
          </div>
        </Rise>
      )}
      <Rise delay={d + 6}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: vertical ? 96 : 88,
            lineHeight: 1.05,
            color: C.paper,
            textShadow: "0 4px 24px rgba(0,0,0,0.45)",
          }}
        >
          {props.title}
        </div>
      </Rise>
      <Rise delay={d + 14}>
        <div
          style={{
            fontFamily: BODY,
            fontSize: vertical ? 40 : 36,
            lineHeight: 1.35,
            color: C.mist,
          }}
        >
          {props.vi}
        </div>
      </Rise>
    </div>
  );
}

/** Thanh đỏ đặc trưng ở mép trái, như trên slide. */
export function RedEdge() {
  const frame = useCurrentFrame();
  const h = interpolate(frame, [0, 18], [0, 100], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 18,
        height: `${h}%`,
        background: C.red,
      }}
    />
  );
}
