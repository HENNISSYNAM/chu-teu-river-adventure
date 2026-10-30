import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { StageLoader } from "@/components/heritrust/StageLoader";

// Trò chơi chỉ chạy trên trình duyệt (canvas, WebAudio): tách khỏi SSR bằng lazy import.
const MemoryGame = lazy(() => import("@/components/heritrust/MemoryGame"));

export const Route = createFileRoute("/tro/ghep-ky-uc")({
  head: () => ({
    meta: [
      { title: "Ghép Mảnh Ký Ức – HeriTrust · Rối nước" },
      {
        name: "description",
        content:
          "Chèo thuyền rối vớt hoa đăng mang ảnh xưa kiều bào gửi về, né ảnh giả AI, ghép lại ảnh chùa Một Cột.",
      },
      { property: "og:title", content: "Ghép Mảnh Ký Ức – HeriTrust · Rối nước" },
      {
        property: "og:description",
        content:
          "Chèo thuyền rối vớt hoa đăng mang ảnh xưa kiều bào gửi về, né ảnh giả AI, ghép lại ảnh chùa Một Cột.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<StageLoader />}>
      <MemoryGame />
    </Suspense>
  ),
});
