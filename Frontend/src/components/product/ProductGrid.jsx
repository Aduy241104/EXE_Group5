import api from "@/lib/api";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useCategoryFilter } from "@/context/CategoryFilterContext";
import ProductCard from "@/components/product/ProductCard"; // ✅ gọi file riêng

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/logo.png";

/* =======================
   🧠 Image builder
======================= */
function imageSrc(product) {
  const raw =
    product?.image_url ??
    product?.image ??
    product?.imageUrl ??
    product?.thumbnail ??
    "";
  if (!raw) return PLACEHOLDER;
  let s = String(raw).replace(/\\/g, "/");
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/uploads/products/")) return `${API}${s}`;
  if (s.startsWith("uploads/products/")) return `${API}/${s}`;
  if (s.startsWith("/uploads/")) {
    const tail = s.slice("/uploads/".length);
    return `${API}${tail.includes("/") ? s : `/uploads/products/${tail}`}`;
  }
  if (s.startsWith("uploads/")) {
    const tail = s.slice("uploads/".length);
    return `${API}/${tail.includes("/") ? s : `uploads/products/${tail}`}`;
  }
  if (s.includes("/")) return `${API}/uploads/${s}`;
  return `${API}/uploads/products/${s}`;
}

/* =======================
   💰 Money formatter
======================= */
const money = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(n || 0));

/* =======================
   🧱 Skeleton loader
======================= */
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

/* =======================
   🧩 Grid chính
======================= */
export default function ProductGrid({ showTabs = true }) {
  const { user } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const { value: cat } = useCategoryFilter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState(new Set());

  const commonParams = useMemo(() => {
    const arr = Array.isArray(cat) ? cat : cat ? [cat] : [];
    return arr.length ? { category: arr } : {};
  }, [cat]);

  // 🧠 Lấy 10 sản phẩm random
  const loadRandom = useCallback(async () => {
    try {
      const res = await api.get("/api/products", {
        params: { limit: 10, sort: "random", ...commonParams },
      });
      return res.data?.items || res.data || [];
    } catch (err) {
      console.error("Load random products error:", err);
      return [];
    }
  }, [commonParams]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      const data = await loadRandom();
      if (!mounted) return;
      setItems(data);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [loadRandom]);

  /* ❤️ Toggle favorite */
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
    }
  };

  /* 🗑️ Admin delete */
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

  return (
    <section className="container mx-auto px-6 py-6">
      <div className="mt-6">
        {loading ? (
          <GridSkeleton count={10} />
        ) : items.length === 0 ? (
          <p className="text-center py-16 text-gray-500">
            Chưa có sản phẩm.
          </p>
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

/* =======================
   Exports
======================= */
export { imageSrc, PLACEHOLDER, money };
