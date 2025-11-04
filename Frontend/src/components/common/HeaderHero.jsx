import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API || "http://localhost:5000";

export default function HeaderHero() {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);

  // 🧠 Lấy danh sách banner từ backend
  useEffect(() => {
    fetch(`${API}/api/banner`)
      .then((res) => res.json())
      .then((data) => setBanners(data || []))
      .catch(console.error);
  }, []);

  // 🔁 Auto next mỗi 5s
  useEffect(() => {
    if (!banners.length) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <section className="bg-white py-16 md:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
        {/* LEFT SIDE */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block bg-blue-50 text-blue-700 font-semibold px-4 py-1 rounded-full text-sm mb-5">
            Nền tảng sinh viên 2025
          </span>

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Sàn thương mại{" "}
            <span className="text-blue-600 underline underline-offset-4 decoration-2">
              UniTrade
            </span>{" "}
            dành cho{" "}
            <span className="text-blue-600">Sinh Viên</span>
          </h1>

          <p className="text-gray-600 mb-8 leading-relaxed max-w-md">
            UniTrade là nơi kết nối cộng đồng sinh viên trên toàn quốc — nơi bạn có thể
            mua bán đồ cũ, sách vở, phụ kiện học tập hay đồ công nghệ với mức giá tiết
            kiệm, an toàn và nhanh chóng.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Link
              to="/products"
              className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition"
            >
              Khám phá ngay →
            </Link>
            <Link
              to="/about"
              className="px-6 py-3 rounded-full border border-blue-600 text-blue-700 hover:bg-blue-50 font-medium transition"
            >
              Về UniTrade
            </Link>
          </div>

          <div className="flex flex-wrap gap-8 text-sm text-gray-600">
            <Feature icon="📦" text="Đăng tin nhanh chóng" />
            <Feature icon="🛡️" text="Giao dịch an toàn" />
            <Feature icon="💰" text="Giá sinh viên cực rẻ" />
          </div>
        </motion.div>

        {/* RIGHT SIDE: Banner slideshow (dynamic) */}
        <div className="relative w-full h-[400px] flex justify-center items-center">
          <div className="relative w-full max-w-[480px] h-[320px] rounded-2xl overflow-hidden shadow-xl bg-gray-50">
            {banners.length > 0 ? (
              <AnimatePresence initial={false}>
                <motion.img
                  key={banners[index].id}
                  src={`${API}${banners[index].image_url}`}
                  alt={`Banner ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              </AnimatePresence>
            ) : (
              <div className="flex justify-center items-center w-full h-full text-gray-400">
                Đang tải banner...
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 to-transparent" />
          </div>

          {/* Indicator dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 flex gap-2">
              {banners.map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === index ? "bg-blue-600 scale-125" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
