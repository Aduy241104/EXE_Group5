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
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-white font-bold flex items-center justify-center shadow-inner">
      {letter}
    </div>
  );
}

export default function SellerSpotlight() {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Gian hàng uy tín</h3>
        <Link to="/sellers" className="text-sm text-orange-600 hover:underline">
          Xem tất cả
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        {SELLERS.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl ring-1 ring-gray-100 hover:ring-orange-200 bg-white p-3 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <LetterAvatar name={s.name} />
                <div>
                  <div className="font-semibold leading-tight flex items-center gap-1">
                    {s.name}
                    {s.verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 ml-1">
                        <ShieldCheck className="w-3 h-3" /> Đã xác minh
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
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 ring-1 ring-orange-200 hover:bg-orange-100"
              >
                Xem gian hàng <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Note nhỏ tăng trust */}
      <div className="mt-3 text-[12px] text-gray-500">
        UniTrade ưu tiên hiển thị các gian hàng có đánh giá cao & giao dịch minh bạch.
      </div>
    </div>
  );
}
