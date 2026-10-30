import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// The game is browser-only (canvas, webcam, WebAudio): keep it out of the SSR
// graph with a lazy dynamic import and a simple water-stage loader.
const WaterPuppetGame = lazy(() => import("@/components/game/WaterPuppetGame"));

export const Route = createFileRoute("/tro/cau-ca")({
  head: () => ({
    meta: [
      { title: "Đêm Hội Rối Nước – Game múa rối nước Việt Nam" },
      {
        name: "description",
        content:
          "Chèo thuyền rối nước, thả câu bắt cá trong đêm hội bên ao làng — điều khiển bằng chuyển động bàn tay qua webcam hoặc bằng nút bấm.",
      },
      { property: "og:title", content: "Đêm Hội Rối Nước – Game múa rối nước Việt Nam" },
      {
        property: "og:description",
        content:
          "Chèo thuyền rối nước, thả câu bắt cá trong đêm hội bên ao làng — điều khiển bằng chuyển động bàn tay qua webcam hoặc bằng nút bấm.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CauCaPage,
});

function StageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-gold/30 border-t-gold" />
      <p className="font-display text-lg text-gold">Đang thắp đèn hội…</p>
    </div>
  );
}

function CauCaPage() {
  return (
    <Suspense fallback={<StageLoader />}>
      <WaterPuppetGame />
    </Suspense>
  );
}
