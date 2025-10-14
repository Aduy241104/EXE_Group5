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
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function FlashSaleStrip() {
  const until = useMemo(() => Date.now() + 1000 * 60 * 60 * 6, []);
  const left = useCountdown(until);

  // dữ liệu giả định
  const deals = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: `Deal hot #${i + 1}`,
    price: (Math.random() * 1_000_000 + 100_000).toFixed(0),
    img: `/logo.png`,
    discount: Math.floor(Math.random() * 40) + 10,
  }));

  return (
    <section className="rounded-2xl bg-gradient-to-b from-white to-orange-50 ring-1 ring-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ rotate: -15 }}
            animate={{ rotate: 15 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
            className="text-2xl"
          >
            🔥
          </motion.div>
          <h3 className="text-lg font-bold text-gray-800">Ưu đãi nhanh</h3>
        </div>
        <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
          Kết thúc trong {left}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {deals.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, y: -3 }}
            className="rounded-xl bg-white overflow-hidden ring-1 ring-gray-100 hover:ring-orange-300 shadow-sm hover:shadow-md transition"
          >
            <div className="relative aspect-square bg-gray-50 flex items-center justify-center">
              <img
                src={d.img}
                alt={d.name}
                className="object-contain w-3/4 h-3/4"
              />
              <div className="absolute top-2 right-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full shadow">
                -{d.discount}%
              </div>
            </div>
            <div className="p-3">
              <div className="font-semibold text-sm line-clamp-1">{d.name}</div>
              <div className="text-orange-600 font-bold text-sm mt-1">
                {new Intl.NumberFormat("vi-VN").format(d.price)} đ
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Sản phẩm hot trong hôm nay 🎯
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
