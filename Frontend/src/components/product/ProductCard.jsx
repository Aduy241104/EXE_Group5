import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Trash2, Eye } from "lucide-react";
import { imageSrc, money } from "@/components/product/ProductGrid";

const PLACEHOLDER = "/logo.png";

export default function ProductCard({
  p,
  idx = 0,
  isAdmin = false,
  favIds = new Set(),
  onToggleFav = () => {},
  onAdminDelete = () => {},
}) {
  // 🧩 Kiểm tra an toàn tránh crash
  if (!p) return null;

  const rating = Number(p?.rating_avg ?? p?.rating ?? 0);
  const sold = Number(p?.sold_count ?? p?.sold ?? 0);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.25) }}
      className="group relative rounded-2xl bg-white shadow-md hover:shadow-xl hover:-translate-y-[4px] overflow-hidden ring-1 ring-gray-100 transition-all duration-500"
    >
      {/* Hình ảnh */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <img
          src={imageSrc(p)}
          alt={p?.name || "Sản phẩm"}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
          loading="lazy"
        />

        {/* Overlay fade */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col justify-center items-center gap-3 opacity-0 group-hover:opacity-100"
        >
          {/* Nút Đặt ngay */}
          <Link
            to={`/products/${p.id}`}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-lg hover:brightness-110 hover:shadow-xl transition-transform hover:scale-[1.05]"
          >
            Đặt ngay
          </Link>

          {/* Hai nút phụ */}
          <div className="flex items-center gap-2">
            <Link
              to={`/products/${p.id}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 text-gray-700 text-sm font-medium hover:bg-blue-50 shadow-sm transition"
            >
              <Eye className="w-4 h-4" /> Xem chi tiết
            </Link>
            <button
              onClick={() => onToggleFav(p)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm transition ${
                favIds.has(p.id)
                  ? "bg-pink-100 text-pink-600"
                  : "bg-white/90 text-gray-700 hover:bg-pink-50"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  favIds.has(p.id) ? "fill-pink-500 text-pink-500" : ""
                }`}
              />
              Yêu thích
            </button>
          </div>
        </motion.div>

        {/* Admin delete */}
        {isAdmin && (
          <button
            title="Xoá sản phẩm vi phạm"
            onClick={() => onAdminDelete(p)}
            className="absolute top-2 right-2 flex items-center gap-1 text-[12px] px-2 py-1 rounded bg-white/95 border text-rose-600 hover:bg-rose-50 shadow"
          >
            <Trash2 className="w-4 h-4" /> Xoá
          </button>
        )}
      </div>

      {/* Thông tin */}
      <div className="p-4">
        <Link
          to={`/products/${p.id}`}
          className="block font-semibold text-gray-800 text-[15px] line-clamp-2 hover:text-blue-600 transition"
          title={p?.name || "Sản phẩm"}
        >
          {p?.name || "Sản phẩm chưa rõ"}
        </Link>

        <div className="mt-2 text-blue-700 font-bold text-lg">
          {money(p?.price ?? 0)}
        </div>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`text-[16px] ${
                i < Math.round(rating) ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </span>
          ))}
          <span className="ml-1 text-gray-600 text-[13px]">({sold || 1})</span>
        </div>
      </div>
    </motion.article>
  );
}
