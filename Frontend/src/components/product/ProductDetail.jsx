import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import {
  Loader2,
  MessageCircle,
  ShoppingCart,
  Star,
} from "lucide-react";
import SellerCard from "./SellerCard";

/* ============ Utils ============ */
const API =
  import.meta.env.VITE_API ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const buildImg = (u) => {
  if (!u) return "/logo.png";
  if (/^https?:\/\//i.test(u)) return u;
  return `${API}/${String(u).replace(/^\/+/, "")}`;
};

const money = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(n || 0));

/* ============ Rating Summary (giữ nguyên logic) ============ */
function RatingSummary({ summary }) {
  const avg = Number(summary?.avg || 0);
  const count = Number(summary?.count || 0);
  const hist = summary?.hist || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const percent = (k) =>
    count ? Math.round(((hist[k] || 0) / count) * 100) : 0;

  return (
    <div className="rounded-2xl bg-gray-50 ring-1 ring-gray-100 p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col items-center justify-center">
          <div className="text-4xl font-extrabold text-blue-600">
            {avg.toFixed(1)}
          </div>
          <div className="mt-1 flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(avg)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {count} lượt đánh giá
          </div>
        </div>

        <div className="md:col-span-2 grid gap-2">
          {[5, 4, 3, 2, 1].map((k) => (
            <div key={k} className="flex items-center gap-3 text-sm">
              <span className="w-6">{k}★</span>
              <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-blue-400 to-sky-500"
                  style={{ width: `${percent(k)}%` }}
                />
              </div>
              <span className="w-8 text-right text-gray-600">
                {percent(k)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ Review Form & List giữ nguyên logic ============ */
function ReviewForm({ productId, onDone }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!rating) return alert("Chọn số sao trước khi gửi!");
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("rating", String(rating));
      fd.append("content", content);
      Array.from(files || []).forEach((f) => fd.append("images", f));
      await api.post(`/api/products/${productId}/reviews`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRating(5);
      setContent("");
      setFiles([]);
      onDone?.();
    } catch {
      alert("Không thể gửi đánh giá");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl bg-gray-50 ring-1 ring-gray-100 p-5 shadow-sm">
      <div className="mb-2 font-semibold text-gray-800">Viết đánh giá</div>
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            onClick={() => setRating(i + 1)}
            className={`h-5 w-5 cursor-pointer ${
              i < rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setFiles(e.target.files)}
        className="block w-full text-sm text-gray-600
        file:mr-3 file:rounded-md file:border-0
        file:bg-blue-600 file:text-white file:px-3 file:py-1
        hover:file:bg-blue-700 transition"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Chia sẻ cảm nhận của bạn..."
        className="mt-3 min-h-[100px] w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
      />
      <button
        onClick={submit}
        disabled={sending}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi đánh giá"}
      </button>
    </div>
  );
}

function ReviewList({ items }) {
  if (!items?.length)
    return (
      <div className="rounded-2xl bg-gray-50 ring-1 ring-gray-100 p-5 text-gray-500">
        Chưa có đánh giá nào.
      </div>
    );

  return (
    <div className="grid gap-3">
      {items.map((r) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl bg-white ring-1 ring-gray-100 p-4 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span className="font-medium">{r.username || "Ẩn danh"}</span>
            <span>•</span>
            <span>{new Date(r.created_at).toLocaleString("vi-VN")}</span>
          </div>
          <div className="flex mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < (r.rating || 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-gray-800 whitespace-pre-line text-sm leading-relaxed">
            {r.content}
          </p>
          {Array.isArray(r.images) && r.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {r.images.map((u, idx) => (
                <img
                  key={idx}
                  src={buildImg(u)}
                  alt=""
                  className="h-20 w-20 rounded-lg border object-cover"
                />
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ============ Helper ============ */
function computeSummaryFromList(list) {
  const items = Array.isArray(list) ? list : [];
  const count = items.length;
  if (!count)
    return { avg: 0, count: 0, hist: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  const hist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  for (const r of items) {
    const k = Math.max(1, Math.min(5, Number(r.rating) || 0));
    sum += k;
    hist[k] = (hist[k] || 0) + 1;
  }
  return { avg: sum / count, count, hist };
}

/* ============ Main Component ============ */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("desc");
  const [mainImg, setMainImg] = useState(null);

  const reviewStats = useMemo(
    () => ({
      avg: Number(summary?.avg || 0),
      count: Number(summary?.count || 0),
    }),
    [summary]
  );

  const reloadReviews = async () => {
    try {
      const { data } = await api.get(`/api/products/${id}/reviews`);
      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      setReviews(items);
      setSummary(data?.summary || computeSummaryFromList(items));
    } catch (e) {
      console.error("Reload reviews error:", e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: p } = await api.get(`/api/products/${id}`);
        setProduct(p);
        setMainImg(buildImg(p.image_url));
        const sellerId = p?.seller_id ?? p?.user_id ?? null;
        const [rRes, sRes] = await Promise.all([
          api.get(`/api/products/${id}/reviews`).catch(() => ({ data: [] })),
          sellerId
            ? api.get(`/api/sellers/${sellerId}/metrics`).catch(() => ({ data: null }))
            : Promise.resolve({ data: null }),
        ]);
        const rData = rRes?.data || {};
        const rItems = Array.isArray(rData.items)
          ? rData.items
          : Array.isArray(rData)
          ? rData
          : [];
        setReviews(rItems);
        setSummary(rData.summary || computeSummaryFromList(rItems));
        setSeller(sRes?.data || null);
      } catch (e) {
        console.error("Load detail error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const specs =
    typeof product?.specs === "string"
      ? (() => {
          try {
            return JSON.parse(product.specs);
          } catch {
            return {};
          }
        })()
      : product?.specs || {};

  const inStock = product?.quantity > 0 || product?.is_available;

  const createOrder = async () => {
    try {
      const { data } = await api.post("/api/orders", {
        product_id: Number(id),
        quantity: 1,
      });
      if (data?.order?.id)
        navigate(`/orders/buyer?highlight=${data.order.id}`);
      else alert("Tạo đơn thành công!");
    } catch {
      alert("Không thể tạo đơn hàng!");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <div className="flex items-center justify-center h-[60vh] text-gray-500">
          <Loader2 className="animate-spin mr-2 h-5 w-5" /> Đang tải sản phẩm...
        </div>
      ) : !product ? (
        <div className="text-center py-20 text-gray-500">
          Không tìm thấy sản phẩm.
        </div>
      ) : (
        <motion.div
          className="mx-auto max-w-6xl bg-white rounded-2xl p-6 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="grid md:grid-cols-2 gap-10">
            {/* Left - Ảnh + thumbnail */}
            <div>
              <img
                src={mainImg}
                alt={product.name}
                className="w-full rounded-2xl object-cover border"
                onError={(e) => (e.currentTarget.src = "/logo.png")}
              />
              <div className="flex gap-3 mt-3">
                {[product.image_url, ...(product.extra_images || [])]
                  .filter(Boolean)
                  .map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImg(buildImg(img))}
                      className={`border rounded-lg overflow-hidden hover:ring-2 ${
                        mainImg === buildImg(img)
                          ? "ring-2 ring-blue-500"
                          : "ring-transparent"
                      }`}
                    >
                      <img
                        src={buildImg(img)}
                        className="h-20 w-20 object-cover"
                      />
                    </button>
                  ))}
              </div>
            </div>

            {/* Right - thông tin */}
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {product.name}
                </h1>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {money(product.price)}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    inStock ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {inStock ? "Còn hàng" : "Hết hàng"}
                </p>
              </div>

              {seller && <SellerCard seller={seller} reviewStats={reviewStats} />}

              <div className="flex flex-col md:flex-row gap-3">
                <button
                  onClick={createOrder}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow hover:bg-blue-700 transition"
                >
                  <ShoppingCart className="h-5 w-5" /> Đặt ngay
                </button>
                <Link
                  to="/messages"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500 text-blue-600 font-semibold hover:bg-blue-50 px-5 py-3"
                >
                  <MessageCircle className="h-5 w-5" /> Nhắn tin
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-10 border-b flex gap-6 text-sm font-semibold">
            {[
              { key: "desc", label: "Description" },
              { key: "spec", label: "Specifications" },
              { key: "rev", label: `Reviews (${summary?.count || 0})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`pb-2 border-b-2 transition ${
                  activeTab === t.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-blue-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab nội dung */}
          <div className="mt-6">
            {activeTab === "desc" && (
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description || "Không có mô tả."}
              </div>
            )}
            {activeTab === "spec" && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {Object.keys(specs).length ? (
                  Object.entries(specs).map(([k, v]) => (
                    <React.Fragment key={k}>
                      <span className="font-medium text-gray-600">{k}</span>
                      <span className="text-gray-800">{v}</span>
                    </React.Fragment>
                  ))
                ) : (
                  <p className="text-gray-500 italic">Không có thông số kỹ thuật.</p>
                )}
              </div>
            )}
            {activeTab === "rev" && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <RatingSummary summary={summary} />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <ReviewForm productId={id} onDone={reloadReviews} />
                  <ReviewList items={reviews} />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
