import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { StageLoader } from "@/components/heritrust/StageLoader";

// Trò chơi chỉ chạy trên trình duyệt (canvas, WebAudio): tách khỏi SSR bằng lazy import.
const VerifyGame = lazy(() => import("@/components/heritrust/VerifyGame"));

export const Route = createFileRoute("/tro/tham-dinh")({
  head: () => ({
    meta: [
      { title: "Tễu Thẩm Định – HeriTrust · Rối nước" },
      {
        name: "description",
        content:
          "Cùng chú Tễu tìm những chỗ AI vẽ sai so với bản ghi di sản gốc đã được ký duyệt — tích trò mô phỏng mô hình FL-2 của HeriTrust.",
      },
      { property: "og:title", content: "Tễu Thẩm Định – HeriTrust · Rối nước" },
      {
        property: "og:description",
        content:
          "Cùng chú Tễu tìm những chỗ AI vẽ sai so với bản ghi di sản gốc đã được ký duyệt — tích trò mô phỏng mô hình FL-2 của HeriTrust.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<StageLoader />}>
      <VerifyGame />
    </Suspense>
  ),
});
