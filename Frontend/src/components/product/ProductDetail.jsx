// src/components/product/ProductDetail.jsx
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

  push(
    product?.image_url ||
      product?.image ||
      product?.thumbnail ||
      product?.cover ||
      product?.photo
  );

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
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    num(x)
  );

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(PLACEHOLDER);
  const [related, setRelated] = useState([]);

  // Seller info
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

        // Seller public profile (để hiển thị: tên, sđt, mssv, trường, avatar,...)
        if (res.data?.seller_id) {
          try {
            const pr = await api.get(
              `${API}/api/profile/${res.data.seller_id}/public`
            );
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

        // Ảnh
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
        console.error("❌ Load chi tiết sản phẩm:", err);
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
      const threshold = (topRef.current?.offsetHeight || 240) - 80;
      setShowSticky(window.scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [product]);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const isOwner =
    product?.seller_id && user?.id && Number(product.seller_id) === Number(user.id);
  const canManage = isAdmin || isOwner;

  /* ======================= Actions ======================= */
  const handleOrder = async () => {
    if (!user) return toast.error("⚠️ Vui lòng đăng nhập để tạo yêu cầu mua.");
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) return toast.error("Số lượng không hợp lệ.");
    if (isOwner) return toast("Bạn không thể mua sản phẩm của chính mình.");

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
    if (!canManage) return;
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

  // Cập nhật quản lý (số lượng + mô tả). Nếu backend chưa có cột quantity vẫn an toàn (BE bỏ qua).
  const [editQty, setEditQty] = useState("");
  const [editDesc, setEditDesc] = useState("");
  useEffect(() => {
    setEditQty(
      product?.quantity != null ? String(product.quantity) : ""
    );
    setEditDesc(product?.description || "");
  }, [product]);

  const saveManage = async () => {
    if (!canManage) return;
    try {
      const payload = {};
      if (editDesc !== product.description) payload.description = editDesc;
      if (editQty !== "" && String(editQty) !== String(product.quantity))
        payload.quantity = Number(editQty);

      if (!Object.keys(payload).length) {
        toast("Không có thay đổi để lưu.");
        return;
      }
      await api.put(`${API}/api/products/${product.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã lưu thay đổi.");
      setProduct((p) => ({ ...p, ...payload }));
    } catch (e) {
      console.error(e);
      toast.error("Không thể lưu thay đổi.");
    }
  };

  /* ======================= UI ======================= */
  if (loading) return <p className="text-center py-10">Đang tải...</p>;
  if (!product) return <p className="text-center py-10">Không tìm thấy sản phẩm.</p>;

  const gallery = collectGallery(product);
  const sellerName =
    sellerProfile?.name || product.seller_name || product.username || "—";
  const sellerPhone = product.seller_phone || sellerProfile?.phone || "—";

  // Trạng thái tồn kho
  const inStock =
    (product?.is_available ?? true) &&
    (product?.quantity == null || Number(product.quantity) > 0);

  const openLightbox = (idx) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

  return (
    <div className="container mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-orange-600">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        {product.category_name ? (
          <Link
            to={`/products?category=${encodeURIComponent(product.category_name)}`}
            className="hover:text-orange-600"
          >
            {product.category_name}
          </Link>
        ) : (
          <span>Sản phẩm</span>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-700 line-clamp-1">{product.name}</span>
      </nav>

      {/* Khối chính: ảnh nhỏ gọn (card) + thông tin */}
      <div ref={topRef} className="grid grid-cols-1 lg:grid-cols-[380px,1fr] gap-8">
        {/* Gallery (ảnh nhỏ hơn) */}
        <div className="space-y-3">
          <motion.div
            key={activeImg}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="relative w-full aspect-[4/3] bg-white rounded-2xl shadow ring-1 ring-gray-100 overflow-hidden"
          >
            <img
              src={activeImg || PLACEHOLDER}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-300 hover:scale-105 cursor-zoom-in"
              onClick={() => openLightbox(Math.max(0, gallery.indexOf(activeImg)))}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
            />
            <span
              className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full ${
                inStock
                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
              }`}
            >
              {inStock ? "Còn hàng" : "Hết hàng"}
            </span>
          </motion.div>

          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(src)}
                  className={`relative flex-shrink-0 aspect-square w-20 rounded-xl overflow-hidden ring-2 transition-all ${
                    activeImg === src
                      ? "ring-orange-500 scale-105"
                      : "ring-transparent hover:ring-gray-300"
                  }`}
                  title={`Ảnh ${i + 1}`}
                >
                  <img
                    src={src}
                    alt={`thumb-${i}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thông tin sản phẩm + người bán */}
        <div className="space-y-6">
          {/* Tiêu đề & giá */}
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-yellow-500 text-lg">{stars(avgDisplay)}</div>
              <div className="text-sm text-gray-600">
                {fmt1(avgDisplay)} / 5 •{" "}
                <b>{countDisplay}</b> lượt đánh giá
              </div>
            </div>
            <div className="text-3xl font-extrabold text-orange-600 mt-3">
              {fmtVND(product.price)}
            </div>
          </div>

          {/* Thông tin người bán */}
          <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow p-4">
            <div className="flex items-center gap-3">
              <img
                src={
                  buildImageUrl(
                    sellerProfile?.avatar_url || product.avatar_url || ""
                  ) || PLACEHOLDER
                }
                onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                alt="avatar"
                className="w-14 h-14 rounded-full object-cover border"
              />
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div>
                  <span className="text-gray-500">Tên:</span>{" "}
                  <span className="font-medium">{sellerName}</span>
                </div>
                <div>
                  <span className="text-gray-500">SĐT:</span>{" "}
                  <span className="font-medium">{sellerPhone}</span>
                </div>
                <div>
                  <span className="text-gray-500">MSSV:</span>{" "}
                  <span className="font-medium">
                    {sellerProfile?.student_code || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Trường:</span>{" "}
                  <span className="font-medium">
                    {sellerProfile?.university || "—"}
                  </span>
                </div>
              </div>
            </div>

            {sellerBadges?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sellerBadges.map((b) => (
                  <span
                    key={b.code}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs border border-orange-100"
                  >
                    🏅 {b.title}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Mô tả */}
          {product.description && (
            <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow p-4">
              <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
              <p className="text-gray-700 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="bg-gray-50 rounded-2xl ring-1 ring-gray-100 p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            {sellerPhone && (
              <a
                href={`tel:${sellerPhone}`}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 text-center"
              >
                📞 Gọi ngay
              </a>
            )}
            <button
              className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600"
              onClick={() =>
                navigate("/messages", {
                  state: { sellerId: product.seller_id, sellerName },
                })
              }
            >
              💬 Nhắn tin
            </button>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-24 border rounded px-3 py-2"
              />
              <button
                className="bg-emerald-600 text-white px-5 py-2 rounded hover:bg-emerald-700"
                onClick={handleOrder}
              >
                📝 Tạo yêu cầu mua
              </button>
            </div>
            {canManage && (
              <button
                onClick={handleDeleteProduct}
                className="bg-rose-600 text-white px-4 py-2 rounded hover:bg-rose-700 sm:ml-auto"
                title={isAdmin ? "Xóa (admin)" : "Xóa sản phẩm của tôi"}
              >
                🗑️ Xóa
              </button>
            )}
          </div>

          {/* Khối quản lý sản phẩm đã đăng (chỉ seller/admin) */}
          {canManage && (
            <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow p-4">
              <h3 className="font-semibold mb-3">Quản lý sản phẩm đã đăng</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Số lượng tồn (quantity)</label>
                  <input
                    type="number"
                    min="0"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="VD: 5"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    * Nếu backend chưa có cột <code>quantity</code>, server sẽ bỏ qua trường này.
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mô tả/Chi tiết</label>
                  <textarea
                    rows={4}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="mt-1 w-full border rounded px-3 py-2"
                    placeholder="Thêm/xóa/chỉnh sửa mô tả sản phẩm…"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={saveManage}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  💾 Lưu thay đổi
                </button>
                <button
                  onClick={() => {
                    setEditQty(product?.quantity ?? "");
                    setEditDesc(product?.description || "");
                  }}
                  className="px-4 py-2 rounded border"
                >
                  Hoàn tác
                </button>
              </div>
            </div>
          )}
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
              aria-label="Đóng"
            >
              ×
            </button>

            <button
              onClick={() =>
                setLightboxIdx((i) => (i > 0 ? i - 1 : gallery.length - 1))
              }
              className="absolute left-5 text-white text-4xl font-bold px-3"
              aria-label="Trước"
            >
              ‹
            </button>

            <motion.img
              key={gallery[lightboxIdx]}
              src={gallery[lightboxIdx] || PLACEHOLDER}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22 }}
              className="max-h-[90vh] max-w-[90vw] object-contain select-none"
              onClick={() => setLightboxIdx((i) => (i + 1) % gallery.length)}
            />

            <button
              onClick={() => setLightboxIdx((i) => (i + 1) % gallery.length)}
              className="absolute right-5 text-white text-4xl font-bold px-3"
              aria-label="Sau"
            >
              ›
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews */}
      <div className="mt-10 border-t pt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Đánh giá & nhận xét</h2>
          <div className="text-sm text-gray-600">
            Tổng: <b>{countDisplay}</b> lượt đánh giá
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white p-5 rounded-xl shadow mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-center gap-4">
              <motion.div
                key={fmt1(avgDisplay)}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold text-orange-500"
              >
                {fmt1(avgDisplay)}
              </motion.div>
              <div className="flex flex-col">
                <div className="text-yellow-500 text-lg">{stars(avgDisplay)}</div>
                <div className="text-sm text-gray-600">
                  {countDisplay} lượt đánh giá
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2">
              {[5, 4, 3, 2, 1].map((r) => {
                const total = ratingSummary.total;
                const count = ratingSummary.counts[r] || 0;
                const percent = total ? (count / total) * 100 : 0;
                return (
                  <div
                    key={r}
                    className="flex items-center gap-3 text-sm text-gray-700 mb-1"
                  >
                    <span className="w-8 text-right">{r}★</span>
                    <div className="flex-1 bg-gray-200 h-2 rounded">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.35 }}
                        className="bg-yellow-400 h-2 rounded"
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-gray-500">
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form gửi review */}
        <div className="bg-gray-50 p-4 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-2">Viết đánh giá của bạn</h3>

          {/* 5 sao có hoạt ảnh */}
          <div className="flex items-center mb-3 gap-1">
            {[1, 2, 3, 4, 5].map((r) => (
              <motion.button
                whileHover={{ scale: 1.15, rotate: -3 }}
                whileTap={{ scale: 0.9 }}
                key={r}
                onClick={() => setNewRating(r)}
                className={`text-2xl ${
                  r <= newRating ? "text-yellow-500" : "text-gray-300"
                }`}
                aria-label={`${r} sao`}
              >
                ★
              </motion.button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {newRating}/5 sao
            </span>
          </div>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setReviewFiles(Array.from(e.target.files || []))}
            className="mb-3"
          />
          {reviewFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {reviewFiles.map((f, i) => (
                <div key={i} className="relative">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={`preview-${i}`}
                    className="w-16 h-16 object-cover rounded border"
                  />
                </div>
              ))}
            </div>
          )}

          <textarea
            className="w-full border rounded px-3 py-2 mb-3"
            placeholder="Chia sẻ cảm nhận của bạn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            onClick={async () => {
              if (!user) return toast.error("Vui lòng đăng nhập để đánh giá.");
              if (!newComment.trim())
                return toast.error("Vui lòng nhập nội dung đánh giá.");
              try {
                setSubmitting(true);
                const fd = new FormData();
                fd.append("rating", String(newRating));
                fd.append("content", newComment);
                reviewFiles.forEach((file) => fd.append("images", file));
                await api.post(`${API}/api/products/${id}/reviews`, fd, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                  },
                });
                toast.success("Cảm ơn bạn đã đánh giá!");
                setNewComment("");
                setNewRating(5);
                setReviewFiles([]);
                const rv = await api.get(`${API}/api/products/${id}/reviews`);
                setReviews(Array.isArray(rv.data) ? rv.data : []);
              } catch (err) {
                console.error(err);
                toast.error("Không thể gửi đánh giá.");
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>

        {/* Danh sách review */}
        {reviews.length === 0 ? (
          <p className="text-gray-500 italic">Chưa có đánh giá nào.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((rv) => {
              const r = clamp(num(rv?.rating, 0), 1, 5);
              const imgs =
                (Array.isArray(rv?.images)
                  ? rv.images
                  : typeof rv?.images === "string"
                  ? (() => {
                      try {
                        const j = JSON.parse(rv.images);
                        const arr = Array.isArray(j) ? j : [];
                        return arr.map((x) =>
                          buildImageUrl(x?.url || x?.src || x?.filename || x)
                        );
                      } catch {
                        return [];
                      }
                    })()
                  : []) || [];
              return (
                <div
                  key={rv.id}
                  className="border p-4 rounded-lg bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-sm text-gray-700">
                      {rv.username || "Người dùng ẩn danh"}
                    </div>
                    <div className="text-yellow-500 text-sm">
                      {"★".repeat(r)}
                      {"☆".repeat(5 - r)}
                    </div>
                  </div>

                  <p className="mt-1 text-gray-700">{rv.content}</p>

                  {imgs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {imgs.map((img, idx) => (
                        <a
                          key={idx}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          title="Xem ảnh"
                        >
                          <img
                            src={img || PLACEHOLDER}
                            alt={`review-${idx}`}
                            className="w-20 h-20 object-cover rounded border"
                            onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-1">
                    {rv.created_at
                      ? new Date(rv.created_at).toLocaleString("vi-VN")
                      : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
