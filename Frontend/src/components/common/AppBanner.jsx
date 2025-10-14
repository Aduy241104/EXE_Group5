import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Sparkles, TicketPercent } from "lucide-react";

export default function AppBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl">
      {/* Nền brand gradient + hạt sáng */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 0.8 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-white/30 blur-3xl rounded-full" />
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/20 blur-3xl rounded-full" />
      </motion.div>

      {/* Nội dung */}
      <div className="relative px-6 py-10 md:px-10 md:py-12 text-white">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Text */}
          <div>
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-sm font-medium"
            >
              <BadgeCheck className="w-4 h-4" /> UniTrade Verified – An toàn & Tin cậy
            </motion.div>

            <motion.h3
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05, duration: 0.55 }}
              className="mt-3 text-2xl md:text-3xl font-extrabold leading-snug drop-shadow"
            >
              Đăng tin miễn phí <span className="underline decoration-white/60">5 bài đầu</span> <br />
              Thu hút hàng nghìn sinh viên mỗi ngày
            </motion.h3>

            <motion.p
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.55 }}
              className="mt-2 text-white/95"
            >
              Đăng bài nhanh – duyệt gọn – giao dịch an toàn. Ưu đãi phí đăng tin cho seller mới.
            </motion.p>

            <motion.div
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.55 }}
              className="mt-5 flex flex-wrap gap-3"
            >
              <Link
                to="/createpost"
                className="px-5 py-3 rounded-2xl bg-white text-orange-600 font-semibold hover:brightness-95 shadow"
              >
                Đăng tin ngay
              </Link>
              <Link
                to="/voucher"
                className="px-5 py-3 rounded-2xl bg-black/20 text-white font-semibold hover:bg-black/25 inline-flex items-center gap-2"
              >
                <TicketPercent className="w-5 h-5" /> Khám phá ưu đãi
              </Link>
            </motion.div>

            {/* bullet nhỏ */}
            <ul className="mt-4 text-sm text-white/90 space-y-1">
              <li className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Hiển thị ưu tiên ở mục Nổi bật</li>
              <li className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Bảo vệ người mua & người bán</li>
            </ul>
          </div>

          {/* Mock preview card */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="justify-self-center"
          >
            <div className="rounded-3xl p-4 bg-white/20 backdrop-blur ring-1 ring-white/40 shadow-xl w-full max-w-sm">
              <div className="rounded-2xl bg-white text-gray-800 overflow-hidden shadow-md">
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                  <img src="/logo.png" alt="preview" className="w-24 h-24 opacity-90" />
                </div>
                <div className="p-4">
                  <div className="font-semibold line-clamp-1">Laptop sinh viên i5 Gen 10</div>
                  <div className="text-orange-600 font-extrabold mt-1">8.900.000 đ</div>
                  <div className="text-xs text-gray-500 mt-1">Đã bán 120+ • Bảo hành 6 tháng</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
