# HeriTrust TVC (Remotion)

Video giới thiệu HeriTrust dài 34 giây, dựng bằng [Remotion](https://www.remotion.dev). Tiêu đề tiếng Anh, phụ đề tiếng Việt. Có hai bản:

| Composition | Khung | Dùng cho |
| --- | --- | --- |
| `HeriTrustTVC` | 1920×1080 (16:9) | màn hình sân khấu KMAC, YouTube |
| `HeriTrustTVCVertical` | 1080×1920 (9:16) | TikTok, Reels, Shorts |

## Kịch bản

| Giây | Cảnh | Nội dung |
| --- | --- | --- |
| 0–4 | Cháy rừng | 30 di tích Hàn Quốc hư hại (3/2025) |
| 4–8 | AI sai lệch | Hơn 65% văn bản di sản do AI viết bị sai lệch văn hoá |
| 8–11 | Tư liệu rời rạc | Không ai chứng minh được bản nào là thật |
| 11–16 | Logo | HeriTrust: lớp niềm tin chung Việt Nam – Hàn Quốc |
| 16–21 | Cách hoạt động | Xác thực · Học liên kết · Duy trì bền vững |
| 20–26 | Rối nước | Chú Tễu và các trò chơi |
| 26–31 | Ba mùa cổ phục | 2023 · 2024 · 2025 |
| 30–34 | Kết | “A heritage record anyone can trust.” · KMAC 2026 |

## Chạy

Cần Node.js 18 trở lên. Thư mục này tách riêng khỏi web game: cài và chạy ngay trong `tvc/`.

```bash
cd tvc
npm install
npm run studio      # xem và chỉnh trên trình duyệt
npm run render      # xuất out/heritrust-tvc.mp4
npm run render:vertical
```

Lần render đầu, Remotion tự tải Chrome Headless Shell (khoảng 100 MB).

## Thêm nhạc

Chép file nhạc (có quyền sử dụng) vào `public/`, ví dụ `public/music.mp3`. Sau đó sửa `music: "music.mp3"` trong `src/Root.tsx`. Nhạc tự tăng dần ở đầu video và nhỏ dần ở cuối.

## Ghi chú

- Ảnh trong `public/` là ảnh minh hoạ và ảnh sự kiện của nhóm. Trước khi đăng công khai, hãy chắc là nhóm được phép dùng ảnh có người trong đó.
- Remotion miễn phí cho cá nhân và nhóm nhỏ. Tổ chức lớn hơn cần giấy phép công ty, xem https://www.remotion.dev/license.
