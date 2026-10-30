import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { StageLoader } from "@/components/heritrust/StageLoader";

// Trình diễn tự chạy chỉ dùng được trên trình duyệt (canvas, WebAudio, toàn màn hình).
const Showcase = lazy(() => import("@/components/heritrust/Showcase"));

export const Route = createFileRoute("/trinh-dien")({
  head: () => ({
    meta: [
      { title: "Trình diễn – HeriTrust · Rối nước" },
      {
        name: "description",
        content:
          "Chế độ trình diễn tự chạy: ba tích trò rối nước HeriTrust nối tiếp nhau, có lời dẫn của chú Tễu.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<StageLoader />}>
      <Showcase />
    </Suspense>
  ),
});
