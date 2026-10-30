import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readLedger, shortHash, type LedgerRecord } from "@/lib/ledger";
import castRow from "@/assets/heritrust/cast-row.webp";
import conceptLotus from "@/assets/heritrust/concept-lotus.webp";
import conceptDragon from "@/assets/heritrust/concept-dragon.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HeriTrust · Sân khấu Rối nước – Các tích trò di sản" },
      {
        name: "description",
        content:
          "Bốn tích trò lấy cảm hứng từ múa rối nước Việt Nam giới thiệu HeriTrust: xác thực bản ghi di sản, cảnh báo sớm rủi ro và kiều bào góp ký ức.",
      },
      { property: "og:title", content: "HeriTrust · Sân khấu Rối nước" },
      {
        property: "og:description",
        content:
          "Chú Tễu dẫn khán giả qua bốn tích trò rối nước về xác thực và bảo vệ di sản Việt Nam – Hàn Quốc.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Hub,
});

const ACTS = [
  {
    to: "/tro/cau-ca",
    icon: "🎣",
    title: "Đêm Hội Rối Nước",
    tag: "Tích thả câu bắt cá",
    desc: "Chèo thuyền rối qua đầm sen, thả câu bắt ba con cá — điều khiển bằng cử chỉ hai bàn tay qua webcam.",
    link: "Mở màn, làm quen sân khấu",
  },
  {
    to: "/tro/rong-phun-nuoc",
    icon: "🐉",
    title: "Rồng Phun Nước Giữ Đình",
    tag: "Tích múa rồng",
    desc: "Rồng rối phun nước dập lửa trên đình chùa. Vòng cảnh báo sớm cho biết nơi sắp cháy để tưới trước.",
    link: "FL-1 · Rủi ro và thiên tai",
  },
  {
    to: "/tro/tham-dinh",
    icon: "🔍",
    title: "Tễu Thẩm Định",
    tag: "Tích tìm chỗ sai",
    desc: "So ảnh AI vẽ lại với bản ghi gốc đã ký duyệt, chỉ ra từng chỗ bị làm sai lệch rồi so hai mã băm.",
    link: "FL-2 · Phát hiện nội dung AI sai lệch",
  },
  {
    to: "/tro/ghep-ky-uc",
    icon: "🪷",
    title: "Ghép Mảnh Ký Ức",
    tag: "Tích hoa đăng",
    desc: "Vớt hoa đăng mang ảnh xưa kiều bào gửi về, né ảnh giả, ghép đủ chín mảnh để người giữ gìn ký duyệt.",
    link: "Lớp cộng đồng · Kiều bào góp tư liệu",
  },
] as const;

function Hub() {
  const [ledger, setLedger] = useState<LedgerRecord[]>([]);
  useEffect(() => {
    setLedger(readLedger().slice(-6).reverse());
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <div className="w-full max-w-5xl">
        <header className="text-center">
          <p className="chip mb-3">🏮 HeriTrust · Sân khấu rối nước 🏮</p>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-gold sm:text-6xl">
            Chú Tễu kể chuyện giữ di sản
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Bốn tích trò lấy cảm hứng từ múa rối nước Việt Nam, mỗi tích kể một phần của HeriTrust —
            mạng chuỗi khối liên minh và học liên kết Việt Nam – Hàn Quốc giúp bản ghi di sản luôn
            kiểm chứng được và di tích có nguy cơ luôn được nhìn thấy.
          </p>
          <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl bg-[#fbf8f1] p-3 shadow-xl">
            <img
              src={castRow}
              alt="Bốn con rối nước sơn mài: chú Tễu, cá chép vàng, rồng xanh và trâu đen"
              className="h-auto w-full"
              width={1774}
              height={887}
            />
          </div>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ACTS.map((a, i) => (
            <Link
              key={a.to}
              to={a.to}
              className="panel group flex flex-col gap-3 p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl leading-none">{a.icon}</span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tích {i + 1} · {a.tag}
                  </p>
                  <h2 className="font-display text-xl font-bold text-gold">{a.title}</h2>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{a.desc}</p>
              <p className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                <span className="chip">{a.link}</span>
                <span className="font-display text-sm font-bold text-gold group-hover:underline">
                  Vào xem →
                </span>
              </p>
            </Link>
          ))}
        </div>

        <section className="panel mt-8 p-5">
          <h2 className="font-display text-lg font-bold text-gold">Bản điện thoại đang thiết kế</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Camera nhận diện bàn tay: vẫy tay để chú Tễu múa, giơ hai tay gọi rồng nước.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
            <img
              src={conceptLotus}
              alt="Ý tưởng giao diện: người chơi vẫy tay trước camera, chú Tễu vớt hoa sen sáng trên ao làng"
              className="h-auto w-full rounded-xl border border-gold/40"
              width={941}
              height={1672}
              loading="lazy"
            />
            <img
              src={conceptDragon}
              alt="Ý tưởng giao diện: giơ hai tay gọi rồng nước, chú Tễu và cá chép vàng múa trước thủy đình"
              className="h-auto w-full rounded-xl border border-gold/40"
              width={941}
              height={1672}
              loading="lazy"
            />
          </div>
        </section>

        <section className="panel mt-4 p-5">
          <h2 className="font-display text-lg font-bold text-gold">HeriTrust trong một phút</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="font-semibold text-foreground">⛓ Xác thực</p>
              <p className="mt-1 text-muted-foreground">
                Mỗi bản ghi có mã HeriID và chữ ký của người giữ gìn, neo mã băm lên chuỗi khối liên
                minh FISCO BCOS. Ai cũng kiểm tra được, không mất phí.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">🤝 Học liên kết</p>
              <p className="mt-1 text-muted-foreground">
                Hai mô hình FL-1 (rủi ro, thiên tai) và FL-2 (nội dung AI sai lệch) được huấn luyện
                chung; dữ liệu gốc không rời khỏi mỗi nước.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">🪷 Cộng đồng</p>
              <p className="mt-1 text-muted-foreground">
                Kiều bào góp ảnh xưa và tài trợ “Nhận đỡ đầu di tích”; học sinh làm Heritage Scouts
                ghi hình di tích.
              </p>
            </div>
          </div>
        </section>

        <section className="panel mt-4 p-5">
          <h2 className="font-display text-lg font-bold text-gold">Sổ cái của bạn</h2>
          {ledger.length ? (
            <ul className="mt-3 divide-y divide-border text-sm">
              {ledger.map((r) => (
                <li
                  key={r.hash}
                  className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="font-mono text-gold">{r.heriId}</span>
                    <span className="ml-2 text-foreground">{r.game}</span>
                    <span className="ml-2 text-muted-foreground">· {r.summary}</span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    #{r.block} · {shortHash(r.hash)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Chưa có bản ghi nào. Diễn xong một tích trò, kết quả sẽ được băm và neo vào đây.
            </p>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Sổ cái mô phỏng, chỉ lưu trên trình duyệt này để minh hoạ cách HeriID hoạt động.
          </p>
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Cảm hứng từ nghệ thuật múa rối nước Việt Nam 🎭 · Ý tưởng dự thi KMAC 2026
        </p>
      </div>
    </div>
  );
}
