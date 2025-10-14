// src/components/product/ProductGrid.jsx
import api from "@/lib/api";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, TrendingUp, Sparkles, Clock, Trash2, Star, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import FeaturedProducts from "@/components/product/FeaturedProducts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/logo.png"; // ✅ dùng placeholder local

/** Chuẩn hoá mọi kiểu giá trị ảnh về absolute URL
 *  Ảnh sản phẩm nằm trong backend/uploads/products
 */
function imageSrc(product) {
  const raw =
    product?.image_url ??
    product?.image ??
    product?.imageUrl ??
    product?.thumbnail ??
    "";

  if (!raw) return PLACEHOLDER;

  // ✅ chuẩn hoá backslash (Windows) -> slash
  let s = String(raw).replace(/\\/g, "/");

  // đã là absolute
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // đã chỉ ra đúng thư mục sản phẩm
  if (s.startsWith("/uploads/products/")) return `${API}${s}`;
  if (s.startsWith("uploads/products/")) return `${API}/${s}`;

  // Nếu là "/uploads/<tail>" mà <tail> chỉ là 1 filename, ta gắn vào products
  if (s.startsWith("/uploads/")) {
    const tail = s.slice("/uploads/".length);
    if (!tail.includes("/")) {
      // chỉ là tên file
      return `${API}/uploads/products/${tail}`;
    }
    // đã có subfolder khác (vd avatars/...), giữ nguyên
    return `${API}${s}`;
  }

  // Nếu là "uploads/<tail>"
  if (s.startsWith("uploads/")) {
    const tail = s.slice("uploads/".length);
    if (!tail.includes("/")) {
      return `${API}/uploads/products/${tail}`;
    }
    return `${API}/${s}`;
  }

  // Nếu string tự có subfolder (vd "products/xxx.jpg" hay "some/dir/xxx.jpg")
  if (s.includes("/")) return `${API}/uploads/${s}`;

  // Trường hợp chỉ là tên file -> ép vào thư mục products
  return `${API}/uploads/products/${s}`;
}

const money = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(n || 0));

/* --------------------------- SKELETON SHIMMER --------------------------- */
function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl ring-1 ring-gray-100 overflow-hidden bg-white shadow-sm"
        >
          <div className="relative aspect-[4/3] animate-pulse bg-gray-100" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded" />
            <div className="h-4 w-1/3 bg-gray-100 animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ PRODUCT CARD ------------------------------ */
function Badge({ children, icon }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-50 text-orange-700 ring-1 ring-orange-200">
      {icon}
      {children}
    </span>
  );
}

function ProductCard({ p, idx, isAdmin, favIds, onToggleFav, onAdminDelete }) {
  const rating = Number(p.rating_avg ?? p.rating ?? 0);
  const sold = Number(p.sold_count ?? p.sold ?? 0);
  const isNew =
    p.created_at ? Date.now() - new Date(p.created_at).getTime() < 1000 * 60 * 60 * 24 * 7 : false;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.2) }}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg ring-1 ring-gray-100 overflow-hidden will-change-transform"
    >
      {/* Ribbon thương hiệu tạo điểm nhấn */}
      <div className="pointer-events-none absolute -left-10 top-4 rotate-[-25deg]">
        <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-semibold px-10 py-1 rounded">
          UniTrade Picks
        </div>
      </div>

      {/* Ảnh */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <img
          src={imageSrc(p)}
          alt={p.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER;
          }}
        />

        {/* ❤️ yêu thích */}
        <button
          title="Yêu thích"
          onClick={() => onToggleFav(p)}
          className={`absolute top-2 left-2 p-1.5 rounded-full bg-white/95 shadow transition ${
            favIds.has(p.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"
          }`}
        >
          <Heart className="w-5 h-5" fill={favIds.has(p.id) ? "currentColor" : "none"} />
        </button>

        {/* admin xoá */}
        {isAdmin && (
          <button
            title="Xoá vi phạm"
            onClick={() => onAdminDelete(p)}
            className="absolute top-2 right-2 px-2 py-1 text-[12px] rounded bg-white/95 border text-rose-600 hover:bg-rose-50 flex items-center gap-1 shadow"
          >
            <Trash2 className="w-4 h-4" /> Xoá
          </button>
        )}

        {/* Hover bar hành động */}
        <div className="pointer-events-none absolute inset-x-2 bottom-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition">
          <div className="pointer-events-auto grid grid-cols-2 gap-2">
            <Link
              to={`/products/${p.id}`}
              className="text-center text-[13px] rounded-lg px-2 py-1.5 bg-white/95 backdrop-blur ring-1 ring-gray-200 hover:bg-white"
            >
              Xem chi tiết
            </Link>
            <Link
              to={`/products/${p.id}`}
              className="text-center text-[13px] rounded-lg px-2 py-1.5 bg-gradient-to-r from-orange-500 to-amber-400 text-white hover:brightness-105"
            >
              Đặt mua nhanh
            </Link>
          </div>
        </div>

        {/* Góc phải: nhãn nhanh */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          {p.free_ship ? (
            <Badge icon={<Truck className="w-3 h-3" />}>Free ship</Badge>
          ) : null}
          {p.verified ? (
            <Badge icon={<ShieldCheck className="w-3 h-3" />}>Đã xác minh</Badge>
          ) : null}
        </div>

        {/* Góc trái trên: NEW / TOP */}
        {isNew && (
          <span className="absolute top-2 left-10 rounded-full bg-amber-500 text-white text-[11px] font-semibold px-2 py-0.5 shadow">
            Mới
          </span>
        )}
        {Number(p.trend_score ?? 0) > 50 && (
          <span className="absolute top-2 left-20 rounded-full bg-rose-500 text-white text-[11px] font-semibold px-2 py-0.5 shadow">
            Hot
          </span>
        )}
      </div>

      {/* body */}
      <div className="p-4">
        <Link
          to={`/products/${p.id}`}
          className="font-semibold line-clamp-2 hover:underline decoration-amber-400/60 underline-offset-4"
          title={p.name}
        >
          {p.name}
        </Link>

        {/* Price row */}
        <div className="mt-2 flex items-center justify-between">
          <div className="text-orange-600 font-extrabold text-lg">{money(p.price)}</div>
          {/* rating + sold */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {rating > 0 ? rating.toFixed(1) : "5.0"}
            </span>
            <span>•</span>
            <span>Đã bán {sold > 0 ? sold : 1}+</span>
          </div>
        </div>

        {/* meta nhỏ */}
        <div className="mt-1 text-[12px] text-gray-500 line-clamp-1">
          {p.category_name || p.category || "Khác"} • {p.location || p.city || "Toàn quốc"}
        </div>
      </div>
    </motion.article>
  );
}

export default function ProductGrid({ showTabs = true }) {
  const { user } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const [tab, setTab] = useState("featured"); // featured | latest | top
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState(new Set());

  /* ================== LOAD API ================== */
  const loadFeatured = useCallback(async () => {
    try {
      const res = await api.get("/api/products/featured");
      return res.data || [];
    } catch {
      const res = await api.get("/api/products", { params: { featured: 1, limit: 20 } });
      return res.data?.items || res.data || [];
    }
  }, []);

  const loadLatest = useCallback(async () => {
    const res = await api.get("/api/products", {
      params: { limit: 20, page: 1, sort: "latest" },
    });
    return res.data?.items || res.data || [];
  }, []);

  const loadTop = useCallback(async () => {
    try {
      const res = await api.get("/api/products/top-search");
      return res.data || [];
    } catch {
      const res = await api.get("/api/products", {
        params: { sort: "popular", limit: 20 },
      });
      return res.data?.items || res.data || [];
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const data =
          tab === "featured"
            ? await loadFeatured()
            : tab === "top"
            ? await loadTop()
            : await loadLatest();
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Load products error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tab, loadFeatured, loadLatest, loadTop]);

  /* ================== FAVORITE ================== */
  const toggleFavorite = async (p) => {
    try {
      if (favIds.has(p.id)) {
        await api.delete(`/api/favorites/${p.id}`);
        setFavIds((s) => {
          const n = new Set(s);
          n.delete(p.id);
          return n;
        });
      } else {
        await api.post(`/api/favorites`, { product_id: p.id });
        setFavIds((s) => new Set(s).add(p.id));
      }
    } catch (e) {
      console.error("favorite error:", e);
      alert("Không thể cập nhật yêu thích.");
    }
  };

  /* ================== ADMIN DELETE ================== */
  const adminDelete = async (p) => {
    if (!isAdmin) return;
    const ok = confirm(`Xoá sản phẩm "${p.name}"?`);
    if (!ok) return;
    try {
      await api.delete(`/api/products/${p.id}`);
      setItems((arr) => arr.filter((x) => x.id !== p.id));
    } catch (e) {
      console.error("delete error:", e);
      alert("Xoá thất bại!");
    }
  };

  const deleteAllProducts = async () => {
    if (!isAdmin) return;
    if (!items.length) {
      alert("Không có sản phẩm nào để xoá!");
      return;
    }
    const ok = confirm("⚠️ Bạn có chắc muốn xoá toàn bộ sản phẩm hiển thị?");
    if (!ok) return;
    try {
      const ids = items.map((p) => p.id);
      await Promise.all(ids.map((id) => api.delete(`/api/products/${id}`)));
      setItems([]);
      alert("✅ Đã xoá toàn bộ sản phẩm.");
    } catch (err) {
      console.error("Xoá tất cả lỗi:", err);
      alert("Không thể xoá toàn bộ sản phẩm.");
    }
  };

  /* ================== UI ================== */
  const tabs = useMemo(
    () => [
      { key: "featured", label: "Nổi bật", icon: <Sparkles className="w-4 h-4" /> },
      { key: "latest", label: "Mới nhất", icon: <Clock className="w-4 h-4" /> },
      { key: "top", label: "Top tìm kiếm", icon: <TrendingUp className="w-4 h-4" /> },
    ],
    []
  );

  return (
    <section className="container mx-auto px-6 py-6">
      {/* Header nhẹ tạo bản sắc */}
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Khám phá hôm nay
        </h2>
        <div className="h-2 w-24 rounded bg-gradient-to-r from-orange-500 to-amber-400" />
      </div>

      {/* Dải Featured chạy auto 1 hàng đầu */}
      <div className="mt-4">
        <FeaturedProducts imageSrc={imageSrc} placeholder={PLACEHOLDER} />
      </div>

      {/* Tabs + hành động */}
      {showTabs && (
        <div className="mt-6 flex items-center flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition ${
                tab === t.key
                  ? "bg-orange-100 border-orange-300 text-orange-700"
                  : "bg-white hover:bg-gray-50"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3">
            <Link to="/products" className="text-orange-600 hover:underline">
              Xem tất cả
            </Link>

            {isAdmin && (
              <button
                onClick={deleteAllProducts}
                className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition"
              >
                <Trash2 className="w-4 h-4" /> Xoá tất cả
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="mt-4">
        {loading ? (
          <GridSkeleton count={8} />
        ) : items.length === 0 ? (
          <p className="text-center py-16 text-gray-500">Chưa có sản phẩm.</p>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {items.map((p, idx) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  idx={idx}
                  isAdmin={isAdmin}
                  favIds={favIds}
                  onToggleFav={toggleFavorite}
                  onAdminDelete={adminDelete}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}

export { imageSrc, PLACEHOLDER };
