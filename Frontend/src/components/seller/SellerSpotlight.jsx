import { motion } from "framer-motion";
import { Star, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const SELLERS = [
  { id: "demo1", name: "CLB Sách Cũ", school: "UTE", rating: 4.9, sold: 320, verified: true },
  { id: "demo2", name: "Laptop 2nd-Life", school: "HCMUT", rating: 4.8, sold: 210, verified: true },
  { id: "demo3", name: "Đồ Gia Dụng SV", school: "UEH", rating: 4.7, sold: 150, verified: false },
  { id: "demo4", name: "Phụ kiện xài bền", school: "HCMUS", rating: 4.9, sold: 190, verified: true },
];

// Avatar chữ cái theo brand
function LetterAvatar({ name }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold flex items-center justify-center shadow-inner">
      {letter}
    </div>
  );
}

export default function SellerSpotlight() {
  return (
    <section className="rounded-3xl bg-white ring-1 ring-gray-100 shadow-sm p-5 relative overflow-hidden">
      {/* Tiêu đề */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          🏪 Gian hàng uy tín
        </h3>
        <Link
          to="/sellers"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          Xem tất cả <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Danh sách sellers */}
      <div className="mt-2 grid grid-cols-1 gap-3 relative z-10">
        {SELLERS.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group relative rounded-2xl border border-gray-100 hover:border-blue-200 bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            {/* Hiệu ứng shine */}
            <div className="absolute inset-0 pointer-events-none shine-mask opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <LetterAvatar name={s.name} />
                <div>
                  <div className="font-semibold leading-tight flex items-center gap-1.5 text-gray-800">
                    {s.name}
                    {s.verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{s.school || "Sinh viên"}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      {s.rating.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>Đã bán {s.sold}+</span>
                  </div>
                </div>
              </div>

              <Link
                to={`/profile/${s.id}`}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100 transition"
              >
                Gian hàng
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Note nhỏ */}
      <div className="mt-3 text-[12px] text-gray-500 border-t pt-3">
        UniTrade ưu tiên hiển thị các gian hàng có đánh giá cao và hoạt động minh bạch.
      </div>

      {/* CSS hiệu ứng shine */}
      <style>{`
        .shine-mask::before {
          content: "";
          position: absolute;
          top: 0;
          left: -150%;
          width: 120%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 100%
          );
          transform: skewX(-20deg);
          animation: shineMove 1.8s ease-in-out infinite;
        }

        @keyframes shineMove {
          0% { left: -150%; }
          100% { left: 150%; }
        }
      `}</style>
    </section>
  );
}
