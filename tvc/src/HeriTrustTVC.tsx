import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BODY, C, Caption, DISPLAY, KenBurns, RedEdge, Rise, Scrim, useVertical } from "./ui";

export interface TVCProps {
  /** tên file nhạc trong public/, để trống nếu không dùng */
  music: string;
  presenter: string;
}

// Các cảnh gối nhau 12 khung hình để chuyển mềm.
const SCENES = [
  { id: "fire", from: 0, len: 126 },
  { id: "ai", from: 114, len: 126 },
  { id: "silos", from: 228, len: 120 },
  { id: "brand", from: 336, len: 150 },
  { id: "network", from: 474, len: 150 },
  { id: "puppets", from: 612, len: 168 },
  { id: "seasons", from: 768, len: 150 },
  { id: "end", from: 906, len: 114 },
] as const;

export const TVC_DURATION = 1020;

function Pad({ children, justify = "flex-end" }: { children: ReactNode; justify?: string }) {
  const vertical = useVertical();
  return (
    <AbsoluteFill
      style={{
        padding: vertical ? "160px 80px 220px" : "110px 140px",
        justifyContent: justify,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function FireScene({ len }: { len: number }) {
  return (
    <AbsoluteFill>
      <KenBurns src="wildfire.webp" duration={len} originX="70%" originY="40%" />
      <Scrim />
      <Pad>
        <Caption
          eyebrow="Korea · March 2025"
          title="Wildfires damaged 30 heritage sites."
          vi="Cháy rừng làm hư hại 30 di tích chỉ trong vài ngày."
        />
      </Pad>
    </AbsoluteFill>
  );
}

function AiScene({ len }: { len: number }) {
  return (
    <AbsoluteFill>
      <KenBurns src="ai-distortion.webp" duration={len} from={1.12} to={1.02} originX="30%" />
      <Scrim />
      <Pad>
        <Caption
          eyebrow="Generative AI"
          title="Over 65% of AI heritage texts get culture wrong."
          vi="Hơn 65% văn bản di sản do AI viết bị sai lệch văn hoá."
        />
      </Pad>
    </AbsoluteFill>
  );
}

function SilosScene({ len }: { len: number }) {
  return (
    <AbsoluteFill>
      <KenBurns src="silos.webp" duration={len} background={C.paper} />
      <Scrim />
      <Pad>
        <Caption
          eyebrow="The gap"
          title="Records sit in silos. No one can prove which is real."
          vi="Tư liệu nằm rải rác — không ai chứng minh được bản nào là thật."
        />
      </Pad>
    </AbsoluteFill>
  );
}

function BrandScene({ len }: { len: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vertical = useVertical();
  const p = spring({ frame: frame - 10, fps, config: { damping: 18, mass: 0.8 } });
  return (
    <AbsoluteFill>
      <KenBurns src="hero-bridge.webp" duration={len} from={1.0} to={1.1} originX="40%" />
      <Scrim side={vertical ? "full" : "left"} />
      <RedEdge />
      <Pad justify="center">
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: vertical ? 190 : 230,
            lineHeight: 1,
            color: C.paper,
            opacity: p,
            transform: `scale(${0.9 + p * 0.1})`,
            transformOrigin: "left center",
          }}
        >
          HeriTrust
        </div>
        <div style={{ height: 28 }} />
        <Caption
          delay={24}
          title="One trust layer for Vietnam–Korea heritage."
          vi="Lớp niềm tin chung cho di sản Việt Nam – Hàn Quốc."
        />
      </Pad>
    </AbsoluteFill>
  );
}

const PILLARS = [
  { en: "Verify", vi: "Xác thực bản ghi có chữ ký người giữ gìn", icon: "✓" },
  { en: "Learn together", vi: "Học liên kết, dữ liệu không rời mỗi nước", icon: "⇄" },
  { en: "Fund upkeep", vi: "Nguồn thu bền vững, kiều bào cùng góp", icon: "❖" },
];

function NetworkScene({ len }: { len: number }) {
  const vertical = useVertical();
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <AbsoluteFill style={{ height: vertical ? "48%" : "100%", width: vertical ? "100%" : "58%" }}>
        <KenBurns src="network.webp" duration={len} from={1.0} to={1.06} background={C.paper} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          left: vertical ? 0 : "58%",
          top: vertical ? "50%" : 0,
          width: vertical ? "100%" : "42%",
          height: vertical ? "50%" : "100%",
          padding: vertical ? "40px 80px 200px" : "110px 90px 110px 40px",
          justifyContent: "center",
          gap: 34,
        }}
      >
        <Rise delay={6}>
          <div
            style={{
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 6,
              color: C.red,
            }}
          >
            HOW IT WORKS
          </div>
        </Rise>
        {PILLARS.map((p, i) => (
          <Rise key={p.en} delay={16 + i * 14}>
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  background: C.ink,
                  color: C.gold,
                  fontSize: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {p.icon}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontWeight: 700,
                    fontSize: 62,
                    color: C.ink,
                    lineHeight: 1.05,
                  }}
                >
                  {p.en}
                </div>
                <div style={{ fontFamily: BODY, fontSize: 32, color: "#4A5568", marginTop: 6 }}>
                  {p.vi}
                </div>
              </div>
            </div>
          </Rise>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Phone({ src, delay, fromX }: { src: string; delay: number; fromX: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 16 } });
  return (
    <Img
      src={staticFile(src)}
      style={{
        height: 760,
        borderRadius: 40,
        border: `6px solid ${C.gold}`,
        boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
        opacity: p,
        transform: `translateX(${(1 - p) * fromX}px) rotate(${(1 - p) * (fromX > 0 ? 6 : -6)}deg)`,
      }}
    />
  );
}

function PuppetsScene({ len }: { len: number }) {
  const frame = useCurrentFrame();
  const vertical = useVertical();
  const fade = interpolate(frame, [0, 12, len - 12, len], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: "#7E211D", opacity: fade }}>
      <AbsoluteFill
        style={{
          flexDirection: vertical ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: vertical ? 40 : 70,
          padding: vertical ? "140px 70px 220px" : "90px 120px",
        }}
      >
        {!vertical && <Phone src="concept-lotus.webp" delay={20} fromX={-500} />}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 36,
            maxWidth: 820,
          }}
        >
          <Rise delay={4} distance={60}>
            <div style={{ background: "#FBF8F1", borderRadius: 28, padding: 18 }}>
              <Img src={staticFile("cast.webp")} style={{ width: vertical ? 860 : 760 }} />
            </div>
          </Rise>
          <Caption
            delay={22}
            align="center"
            maxWidth={820}
            eyebrow="Water puppetry games"
            title="Chú Tễu shows everyone how it works."
            vi="Trò chơi rối nước: cảnh báo sớm, bắt ảnh AI sai, ghép ký ức kiều bào."
          />
        </div>
        {/* bản dọc không đủ chỗ cho hai điện thoại: chỉ giữ ảnh nhân vật và lời */}
        {!vertical && <Phone src="concept-dragon.webp" delay={30} fromX={500} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

const SEASONS = [
  { src: "season-2023.jpg", year: "2023" },
  { src: "season-2024a.jpg", year: "2024" },
  { src: "season-2024b.jpg", year: "2024" },
  { src: "season-2025.jpg", year: "2025" },
];

function SeasonsScene({ len }: { len: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const vertical = useVertical();
  const fade = interpolate(frame, [0, 12, len - 12, len], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: fade }}>
      <AbsoluteFill
        style={{
          display: "grid",
          gridTemplateColumns: vertical ? "1fr 1fr" : "repeat(4, 1fr)",
          gridTemplateRows: vertical ? "1fr 1fr" : "1fr",
          gap: 16,
          padding: vertical ? "16px 16px 760px" : "16px 16px 360px",
        }}
      >
        {SEASONS.map((s, i) => {
          const p = spring({ frame: frame - 6 - i * 8, fps, config: { damping: 200 } });
          const zoom = interpolate(frame, [0, len], [1.08, 1.0]);
          return (
            <div
              key={s.src}
              style={{ position: "relative", overflow: "hidden", borderRadius: 18, opacity: p }}
            >
              <Img
                src={staticFile(s.src)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "50% 30%",
                  transform: `scale(${zoom})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 16,
                  bottom: 16,
                  background: C.red,
                  color: C.paper,
                  fontFamily: BODY,
                  fontWeight: 700,
                  fontSize: 30,
                  padding: "6px 18px",
                  borderRadius: 999,
                }}
              >
                {s.year}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Pad>
        <Caption
          eyebrow="Track record · 2023–2025"
          title="Three seasons of Việt cổ phục. A community ready."
          vi="Ba mùa sự kiện cổ phục Việt — cộng đồng đã sẵn sàng cùng làm."
        />
      </Pad>
    </AbsoluteFill>
  );
}

function EndScene({ len, presenter }: { len: number; presenter: string }) {
  const frame = useCurrentFrame();
  const vertical = useVertical();
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: fadeIn }}>
      <RedEdge />
      <Pad justify="center">
        <Rise delay={4}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: vertical ? 170 : 200,
              color: C.paper,
              lineHeight: 1,
            }}
          >
            HeriTrust
          </div>
        </Rise>
        <div style={{ height: 30 }} />
        <Caption
          delay={14}
          title="A heritage record anyone can trust."
          vi="Bản ghi di sản ai cũng kiểm chứng được."
        />
        <div style={{ height: 50 }} />
        <Rise delay={36}>
          <div
            style={{
              fontFamily: BODY,
              fontSize: vertical ? 34 : 30,
              color: C.gold,
              letterSpacing: 3,
            }}
          >
            KMAC 2026 · {presenter}
          </div>
        </Rise>
      </Pad>
    </AbsoluteFill>
  );
}

export function HeriTrustTVC({ music, presenter }: TVCProps) {
  const frame = useCurrentFrame();
  const musicVolume = interpolate(
    frame,
    [0, 20, TVC_DURATION - 40, TVC_DURATION],
    [0, 0.8, 0.8, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const render = (id: (typeof SCENES)[number]["id"], len: number) => {
    switch (id) {
      case "fire":
        return <FireScene len={len} />;
      case "ai":
        return <AiScene len={len} />;
      case "silos":
        return <SilosScene len={len} />;
      case "brand":
        return <BrandScene len={len} />;
      case "network":
        return <NetworkScene len={len} />;
      case "puppets":
        return <PuppetsScene len={len} />;
      case "seasons":
        return <SeasonsScene len={len} />;
      case "end":
        return <EndScene len={len} presenter={presenter} />;
    }
  };
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {music && <Audio src={staticFile(music)} volume={musicVolume} />}
      {SCENES.map((s) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.len} name={s.id}>
          {render(s.id, s.len)}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
