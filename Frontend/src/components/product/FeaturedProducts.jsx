import api from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/logo.png"; // dùng placeholder local để tránh ERR_NAME_NOT_RESOLVED

// Chuẩn hoá ảnh: nếu không absolute thì ghép về `${API}/uploads/${filename}`
// Đồng thời hỗ trợ trường hợp đã có "/uploads/...".
const isAbs = (u) => /^https?:\/\//i.test(u || "");
function buildImageUrl(input) {
  if (!input) return PLACEHOLDER;

  // ✅ chuẩn hoá backslash (Windows) -> slash
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
        // Chuẩn hóa image_url ngay sau khi tải
        const arr = (res.data || []).slice(0, 12).map((p) => ({
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

  return (
    <section className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">🔥 Sản phẩm nổi bật</h3>
        {/* <span className="text-sm text-gray-500">Tự động chạy ngang</span> */}
      </div>

      <div className="relative overflow-hidden rounded-xl">
        <div
          ref={trackRef}
          className="flex gap-4 py-3 animate-[slideRow_25s_linear_infinite]"
        >
          {[...items, ...items].map((p, idx) => (
            <Link
              key={p.id + "-" + idx}
              to={`/products/${p.id}`}
              className="min-w-[210px] max-w-[210px] bg-white rounded-xl shadow hover:shadow-md overflow-hidden"
            >
              <div className="w-full aspect-[4/3] overflow-hidden">
                <img
                  src={p.image_url || PLACEHOLDER}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                />
              </div>
              <div className="p-3">
                <p className="font-medium line-clamp-1">{p.name}</p>
                <p className="text-orange-600 font-semibold mt-0.5">
                  {new Intl.NumberFormat("vi-VN").format(p.price || 0)} đ
                </p>
              </div>
            </Link>
          ))}
        </div>
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
