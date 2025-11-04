import api from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/logo.png";

// Hàm chuẩn hoá ảnh
const isAbs = (u) => /^https?:\/\//i.test(u || "");
function buildImageUrl(input) {
  if (!input) return PLACEHOLDER;
  const s = String(input).replace(/\\/g, "/");
  if (isAbs(s)) return s;
  if (s.startsWith("/uploads/")) return `${API}${s}`;
  if (s.startsWith("uploads/")) return `${API}/${s}`;
  return `${API}/uploads/${s}`;
}

export default function FeaturedProducts() {
  const [items, setItems] = useState([]);
  const trackRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/api/products/featured");
        if (!mounted) return;
        const arr = (res.data || [])
          .slice(0, 12)
          .map((p) => ({
            ...p,
            image_url: buildImageUrl(p?.image_url || p?.image || p?.thumbnail || ""),
          }));
        setItems(arr);
      } catch {
        setItems([]);
      }
    })();
    return () => (mounted = false);
  }, []);

  if (!items.length) return null;

  // Animation variants cho từng item
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.08,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  };

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-1">
          🌟 Sản phẩm nổi bật
        </h3>
        <span className="text-sm text-gray-500"></span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <motion.div
          ref={trackRef}
          className="flex gap-4 py-4 animate-[slideRow_25s_linear_infinite]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {[...items, ...items].map((p, idx) => (
            <motion.div
              key={p.id + "-" + idx}
              variants={itemVariants}
              custom={idx}
              className="min-w-[210px] max-w-[210px]"
            >
              <Link
                to={`/products/${p.id}`}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden block"
              >
                <div className="w-full aspect-[4/3] overflow-hidden">
                  <motion.img
                    src={p.image_url || PLACEHOLDER}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER;
                    }}
                    whileHover={{ scale: 1.07 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {p.name}
                  </p>
                  <p className="text-blue-700 font-semibold mt-0.5">
                    {new Intl.NumberFormat("vi-VN").format(p.price || 0)} đ
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes slideRow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
