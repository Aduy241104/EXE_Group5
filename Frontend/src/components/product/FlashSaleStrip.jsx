import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

function useCountdown(untilMs) {
  const [t, setT] = useState(untilMs - Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(untilMs - Date.now()), 1000);
    return () => clearInterval(id);
  }, [untilMs]);
  const pad = (n) => String(Math.max(0, n)).padStart(2, "0");
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  return { h: pad(h), m: pad(m), s: pad(s) };
}

export default function FlashSaleStrip() {
  const until = useMemo(() => Date.now() + 1000 * 60 * 60 * 6, []); // 6 hours from now
  const { h, m, s } = useCountdown(until);

  // Dữ liệu giả lập sản phẩm Flash Sale
  const deals = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: `Deal hot #${i + 1}`,
    price: (Math.random() * 1_000_000 + 100_000).toFixed(0),
    img: `/logo.png`, // Placeholder image
    discount: Math.floor(Math.random() * 40) + 10, // Random discount 10% - 50%
  }));

  return (
    <section className="rounded-2xl overflow-hidden shadow-md ring-1 ring-gray-200 bg-gradient-to-r from-white via-blue-50 to-blue-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-blue-200">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 10 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.3 }}
            className="text-2xl"
          >
            ⚡
          </motion.div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800">
            Flash Sale đang diễn ra!
          </h3>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1 font-semibold">
          {[{ value: h, label: "Giờ" }, { value: m, label: "Phút" }, { value: s, label: "Giây" }].map(
            (x, i) => (
              <div
                key={i}
                className="flex flex-col items-center bg-blue-600 text-white px-3 py-2 rounded-md text-[14px] shadow-sm"
              >
                <span>{x.value}</span>
                <span className="text-xs">{x.label}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Product grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {deals.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.45 }}
            whileHover={{ scale: 1.05, y: -3 }}
            className="relative rounded-xl bg-white overflow-hidden ring-1 ring-gray-100 hover:ring-blue-300 shadow-sm hover:shadow-lg transition"
          >
            {/* Ảnh */}
            <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
              <img
                src={d.img}
                alt={d.name}
                className="object-contain w-3/4 h-3/4 transition-transform duration-500 hover:scale-110"
              />
              {/* Tag giảm giá */}
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full shadow font-semibold">
                -{d.discount}%
              </div>
            </div>

            {/* Thông tin */}
            <div className="p-3">
              <div className="font-semibold text-sm text-gray-800 line-clamp-1">{d.name}</div>
              <div className="text-blue-700 font-bold text-sm mt-1">
                {new Intl.NumberFormat("vi-VN").format(d.price)} đ
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Ưu đãi giới hạn hôm nay 🎯</div>
            </div>

            {/* Viền sáng pulse nhẹ */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-xl border border-blue-200"
              animate={{
                opacity: [0.25, 0, 0.25],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
