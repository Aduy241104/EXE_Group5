import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, BadgeCheck, TicketPercent } from "lucide-react";

export default function AppBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50 via-white to-blue-100 border border-blue-100 shadow-sm">
      {/* Nền hiệu ứng nhẹ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 0.8 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-16 -top-10 w-72 h-72 bg-blue-200/40 blur-3xl rounded-full" />
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-cyan-200/40 blur-3xl rounded-full" />
      </motion.div>

      {/* Nội dung */}
      <div className="relative px-6 py-10 md:px-12 md:py-14">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div>
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium"
            >
              <BadgeCheck className="w-4 h-4 text-blue-600" /> UniTrade Verified – An toàn & Tin cậy
            </motion.div>

            <motion.h3
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05, duration: 0.55 }}
              className="mt-3 text-2xl md:text-3xl font-extrabold leading-snug text-gray-800"
            >
              Đăng tin miễn phí <span className="text-blue-600">5 bài đầu</span> <br />
              Thu hút hàng nghìn sinh viên mỗi ngày
            </motion.h3>

            <motion.p
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.55 }}
              className="mt-2 text-gray-600"
            >
              Đăng bài nhanh – duyệt gọn – giao dịch an toàn. Ưu đãi phí đăng tin cho người bán mới.
            </motion.p>

            <motion.div
              initial={{ y: 12, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.55 }}
              className="mt-6 flex flex-wrap gap-3"
            >
              <Link
                to="/createpost"
                className="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-md"
              >
                Đăng tin ngay
              </Link>
              <Link
                to="/voucher"
                className="px-6 py-3 rounded-full bg-white text-blue-700 font-semibold border border-blue-200 hover:shadow-md inline-flex items-center gap-2"
              >
                <TicketPercent className="w-5 h-5 text-blue-500" /> Khám phá ưu đãi
              </Link>
            </motion.div>

            {/* bullet nhỏ */}
            <ul className="mt-4 text-sm text-gray-600 space-y-1">
              <li className="inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" /> Hiển thị ưu tiên ở mục Nổi bật
              </li>
              <li className="inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" /> Bảo vệ người mua & người bán
              </li>
            </ul>
          </div>

          {/* Preview card mockup */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="justify-self-center"
          >
            <div className="rounded-3xl p-4 bg-white shadow-lg ring-1 ring-gray-200 w-full max-w-sm">
              <div className="rounded-2xl overflow-hidden border border-gray-100">
                <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center">
                  <img src="/logo.png" alt="preview" className="w-24 h-24 opacity-90" />
                </div>
                <div className="p-4">
                  <div className="font-semibold text-gray-800 line-clamp-1">Laptop sinh viên i5 Gen 10</div>
                  <div className="text-blue-700 font-extrabold mt-1">8.900.000 đ</div>
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
