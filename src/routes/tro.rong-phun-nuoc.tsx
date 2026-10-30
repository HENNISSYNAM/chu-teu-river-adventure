import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { StageLoader } from "@/components/heritrust/StageLoader";

// Trò chơi chỉ chạy trên trình duyệt (canvas, WebAudio): tách khỏi SSR bằng lazy import.
const DragonGame = lazy(() => import("@/components/heritrust/DragonGame"));

export const Route = createFileRoute("/tro/rong-phun-nuoc")({
  head: () => ({
    meta: [
      { title: "Rồng Phun Nước Giữ Đình – HeriTrust · Rối nước" },
      {
        name: "description",
        content:
          "Múa rồng rối nước phun nước dập lửa, giữ đình chùa nhờ cảnh báo sớm của mô hình rủi ro FL-1 trong mạng HeriTrust.",
      },
      { property: "og:title", content: "Rồng Phun Nước Giữ Đình – HeriTrust · Rối nước" },
      {
        property: "og:description",
        content:
          "Múa rồng rối nước phun nước dập lửa, giữ đình chùa nhờ cảnh báo sớm của mô hình rủi ro FL-1 trong mạng HeriTrust.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<StageLoader />}>
      <DragonGame />
    </Suspense>
  ),
});
