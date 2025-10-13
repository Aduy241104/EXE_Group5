import api from "@/lib/api";
import { useEffect, useState, useContext, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/logo.png";

/* ======================= Helpers Ảnh ======================= */
const isAbs = (u) => /^https?:\/\//i.test(u || "");
function buildImageUrl(input) {
  if (!input) return PLACEHOLDER;
  const raw = String(input).replace(/\\/g, "/");
  if (isAbs(raw)) return raw;
  if (raw.startsWith("/uploads/")) return `${API}${raw}`;
  if (raw.startsWith("uploads/")) return `${API}/${raw}`;
  if (raw.startsWith("products/")) return `${API}/uploads/${raw}`;
  return `${API}/uploads/products/${raw}`;
}

/** Gom gallery từ mọi kiểu định danh có thể xuất hiện */
function collectGallery(product) {
  const list = [];
  const push = (v) => v && list.push(buildImageUrl(v));

  push(product?.image_url || product?.image || product?.thumbnail || product?.cover || product?.photo);

  if (Array.isArray(product?.images)) {
    for (const it of product.images) {
      if (!it) continue;
      if (typeof it === "string") push(it);
      else push(it.url || it.src || it.filename);
    }
  }
  if (typeof product?.images === "string") {
    try {
      const arr = JSON.parse(product.images);
      if (Array.isArray(arr)) {
        for (const it of arr) {
          if (!it) continue;
          if (typeof it === "string") push(it);
          else push(it.url || it.src || it.filename);
        }
      }
    } catch {}
  }
  return [...new Set(list.filter(Boolean))];
}

/* ======================= Helpers khác ======================= */
const num = (v, def = 0) => {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : def;
};
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const stars = (x) => {
  const r = Math.round(clamp(num(x), 0, 5));
  return "★".repeat(r) + "☆".repeat(5 - r);
};
const fmt1 = (x) => num(x).toFixed(1);
const fmtVND = (x) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num(x));

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(PLACEHOLDER);
  const [related, setRelated] = useState([]);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [sellerBadges, setSellerBadges] = useState([]);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewFiles, setReviewFiles] = useState([]);

  // Sticky action bar
  const topRef = useRef(null);
  const [showSticky, setShowSticky] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  /* ======================= Fetch chính ======================= */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`${API}/api/products/${id}`);
        if (!mounted) return;
        setProduct(res.data);

        // Seller profile
        if (res.data?.seller_id) {
          try {
            const pr = await api.get(`${API}/api/profile/${res.data.seller_id}/public`);
            if (!mounted) return;
            setSellerProfile(pr.data?.profile || null);
            setSellerBadges(pr.data?.badges || []);
          } catch {}
        }

        // Reviews
        try {
          const rv = await api.get(`${API}/api/products/${id}/reviews`);
          if (!mounted) return;
          setReviews(Array.isArray(rv.data) ? rv.data : []);
        } catch {}

        const gal = collectGallery(res.data);
        setActiveImg(gal[0] || PLACEHOLDER);

        // Related
        try {
          let rel = [];
          if (res.data?.category_id) {
            const q = await api.get(`${API}/api/products`, {
              params: { category_id: res.data.category_id, limit: 8 },
            });
            rel = q.data?.items || q.data || [];
          }
          if ((!rel || rel.length === 0) && res.data?.seller_id) {
            const q2 = await api.get(`${API}/api/products`, {
              params: { seller_id: res.data.seller_id, limit: 8 },
            });
            rel = q2.data?.items || q2.data || [];
          }
          if (!mounted) return;
          setRelated((rel || []).filter((p) => String(p.id) !== String(id)));
        } catch {}
      } catch (err) {
        console.error("❌ Lỗi khi load chi tiết sản phẩm:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  /* ======================= Rating summary ======================= */
  const ratingSummary = useMemo(() => {
    const total = reviews.length || 0;
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of reviews) {
      const v = clamp(num(r?.rating, 0), 1, 5);
      counts[v] = (counts[v] || 0) + 1;
      sum += v;
    }
    const avg = total ? sum / total : 0;
    return { total, counts, avg };
  }, [reviews]);

  const avgDisplay = useMemo(
    () => num(product?.rating_avg ?? ratingSummary.avg, 0),
    [product?.rating_avg, ratingSummary.avg]
  );
  const countDisplay = useMemo(
    () => num(product?.rating_count ?? ratingSummary.total, 0),
    [product?.rating_count, ratingSummary.total]
  );

  /* ======================= Sticky toggle ======================= */
  useEffect(() => {
    const onScroll = () => {
      const threshold = (topRef.current?.offsetHeight || 300) - 80;
      setShowSticky(window.scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [product]);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const canDelete =
    isAdmin || (product?.seller_id && user?.id && Number(product.seller_id) === Number(user.id));

  /* ======================= Actions ======================= */
  const handleOrder = async () => {
    if (!user) return toast.error("⚠️ Vui lòng đăng nhập để tạo yêu cầu mua.");
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) return toast.error("Số lượng không hợp lệ.");
    if (product.seller_id && Number(product.seller_id) === Number(user.id))
      return toast("Bạn không thể mua sản phẩm của chính mình.");

    try {
      await api.post(
        `${API}/api/orders`,
        { product_id: product.id, quantity: qty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("🎉 Đã tạo yêu cầu mua!");
      navigate("/orders/buyer");
    } catch {
      toast.error("Không thể tạo yêu cầu mua.");
    }
  };

  const handleDeleteProduct = async () => {
    if (!canDelete) return;
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await api.delete(`${API}/api/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa sản phẩm.");
      navigate("/products");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Không thể xóa sản phẩm.");
    }
  };

  const submitReview = async () => {
    if (!user) return toast.error("Vui lòng đăng nhập để đánh giá.");
    if (!newComment.trim()) return toast.error("Vui lòng nhập nội dung đánh giá.");

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("rating", String(newRating));
      fd.append("content", newComment);
      reviewFiles.forEach((file) => fd.append("images", file));

      await api.post(`${API}/api/products/${id}/reviews`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      toast.success("Cảm ơn bạn đã đánh giá!");
      setNewComment(""); setNewRating(5); setReviewFiles([]);
      const rv = await api.get(`${API}/api/products/${id}/reviews`);
      setReviews(Array.isArray(rv.data) ? rv.data : []);
    } catch {
      toast.error("Không thể gửi đánh giá.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ======================= UI ======================= */
  if (loading) return <p className="text-center py-10">Đang tải...</p>;
  if (!product) return <p className="text-center py-10">Không tìm thấy sản phẩm.</p>;

  const gallery = collectGallery(product);
  const sellerName = product.seller_name || sellerProfile?.name || "—";

  const openLightbox = (idx) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-3">
        <Link to="/" className="hover:text-orange-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        {product.category_name ? (
          <Link to={`/products?category=${encodeURIComponent(product.category_name)}`} className="hover:text-orange-600">
            {product.category_name}
          </Link>
        ) : <span>Sản phẩm</span>}
        <span className="mx-2">/</span>
        <span className="text-gray-700 line-clamp-1">{product.name}</span>
      </nav>

      {/* Khối chính */}
      <div ref={topRef} className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Gallery nâng cấp */}
        <div>
          <motion.div
            key={activeImg}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative w-full aspect-square bg-white rounded-2xl shadow ring-1 ring-gray-100 overflow-hidden"
          >
            <img
              src={activeImg || PLACEHOLDER}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-300 hover:scale-105 cursor-zoom-in"
              onClick={() => openLightbox(gallery.indexOf(activeImg))}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
            />
          </motion.div>

          {gallery.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(src)}
                  className={`relative flex-shrink-0 aspect-square w-20 rounded-xl overflow-hidden ring-2 transition-all duration-150 ${
                    activeImg === src ? "ring-orange-500 scale-105" : "ring-transparent hover:ring-gray-300"
                  }`}
                  title={`Ảnh ${i + 1}`}
                >
                  <img src={src} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thông tin sản phẩm */}
        <div>
          <h1 className="text-3xl font-bold mb-1">{product.name}</h1>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-yellow-500 text-xl">{stars(avgDisplay)}</div>
            <div className="text-sm text-gray-600">
              {fmt1(avgDisplay)} / 5 • {countDisplay} đánh giá
            </div>
          </div>

          <div className="text-3xl font-extrabold text-orange-600 mb-2">{fmtVND(product.price)}</div>

          {/* Seller */}
          <div className="bg-gray-50 p-4 rounded-xl ring-1 ring-gray-100 mb-6">
            <h2 className="font-semibold text-lg mb-2">Thông tin người bán</h2>
            <p><span className="font-medium">Tên:</span> {sellerName}</p>
            {product.seller_phone && (
              <p><span className="font-medium">SĐT:</span> {product.seller_phone}</p>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {product.seller_phone && (
              <a href={`tel:${product.seller_phone}`} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
                📞 Gọi ngay
              </a>
            )}
            <button
              className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600"
              onClick={() => navigate("/messages", { state: { sellerId: product.seller_id, sellerName } })}
            >
              💬 Nhắn tin
            </button>
            <div className="flex gap-2 items-center">
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-24 border rounded px-3 py-2" />
              <button className="bg-emerald-600 text-white px-5 py-2 rounded hover:bg-emerald-700" onClick={handleOrder}>📝 Mua ngay</button>
            </div>
            {canDelete && (
              <button onClick={handleDeleteProduct} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 sm:ml-2">
                🗑️ Xóa sản phẩm
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox toàn màn hình */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-5 right-5 text-white text-3xl font-bold"
            >
              ×
            </button>

            <button
              onClick={() => setLightboxIdx((i) => (i > 0 ? i - 1 : gallery.length - 1))}
              className="absolute left-5 text-white text-4xl font-bold px-3"
            >
              ‹
            </button>

            <motion.img
              key={gallery[lightboxIdx]}
              src={gallery[lightboxIdx] || PLACEHOLDER}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="max-h-[90vh] max-w-[90vw] object-contain select-none"
              onClick={() => setLightboxIdx((i) => (i + 1) % gallery.length)}
            />

            <button
              onClick={() => setLightboxIdx((i) => (i + 1) % gallery.length)}
              className="absolute right-5 text-white text-4xl font-bold px-3"
            >
              ›
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ======================= Sticky wrapper ======================= */
function AnimateSticky({ show, children }) {
  return (
    <motion.div
      initial={false}
      animate={{ y: show ? 0 : 100, opacity: show ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t shadow-lg"
    >
      {children}
    </motion.div>
  );
}
