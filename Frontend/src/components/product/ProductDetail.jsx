// src/components/product/ProductDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { motion } from "framer-motion";
import {
  Loader2, MessageCircle, ShoppingCart, MapPin, User, Phone, Star,
  Image as ImageIcon
} from "lucide-react";

/* ✅ NEW: tách SellerCard thành file riêng */
import SellerCard from "./SellerCard";

/* ---------- Utils ---------- */
const API =
  import.meta.env.VITE_API ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const buildImg = (u) => {
  if (!u) return "/logo.png";
  if (/^https?:\/\//i.test(u)) return u;
  return `${API}/${String(u).replace(/^\/+/, "")}`;
};

const Badge = ({ children, color }) => (
  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
    {children}
  </span>
);

function StatusBadge({ status, inStock }) {
  if (inStock === false) return <Badge color="bg-gray-200 text-gray-700">Hết hàng</Badge>;
  const map = {
    active: "bg-green-100 text-green-700",
    sold: "bg-blue-100 text-blue-700",
    expired: "bg-amber-100 text-amber-700",
    hidden: "bg-gray-100 text-gray-700",
  };
  return <Badge color={map[status] || "bg-gray-100 text-gray-700"}>{status || "active"}</Badge>;
}

/* ---------- Price range ---------- */
function PriceRangeCard({ range }) {
  const { min = 0, max = 0, median = 0, count = 0 } = range || {};
  const percent = useMemo(() => {
    if (!max || !min || median < min) return 0;
    return Math.min(100, Math.max(0, ((median - min) / (max - min)) * 100));
  }, [min, max, median]);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 font-semibold text-gray-800">Khoảng giá thị trường</div>
      <div className="mb-1 h-2 w-full rounded-full bg-gray-200">
        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${percent || 0}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between text-sm text-gray-600">
        <span>{(min / 1e6).toFixed(2)}tr</span>
        <span className="font-semibold text-blue-700">{(median / 1e6).toFixed(2)}tr</span>
        <span>{(max / 1e6).toFixed(2)}tr</span>
      </div>
      <div className="mt-1 text-xs text-gray-500">Dữ liệu {count} giao dịch / 3 tháng gần nhất</div>
    </div>
  );
}

/* ---------- Rating summary ---------- */
function RatingSummary({ summary }) {
  const avg = Number(summary?.avg || 0);
  const count = Number(summary?.count || 0);
  const hist = summary?.hist || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const percent = (k) => (count ? Math.round(((hist[k] || 0) / count) * 100) : 0);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col items-center justify-center">
          <div className="text-4xl font-extrabold text-orange-600">{avg.toFixed(1)}</div>
          <div className="mt-1 flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
            ))}
          </div>
          <div className="mt-1 text-sm text-gray-600">{count} lượt đánh giá</div>
        </div>
        <div className="md:col-span-2 grid gap-2">
          {[5, 4, 3, 2, 1].map((k) => (
            <div key={k} className="flex items-center gap-3 text-sm">
              <span className="w-6">{k}★</span>
              <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-2 bg-emerald-500" style={{ width: `${percent(k)}%` }} />
              </div>
              <span className="w-8 text-right text-gray-600">{percent(k)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Review form & list ---------- */
function ReviewForm({ productId, onDone }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!rating) return alert("Chọn số sao");
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
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || e?.response?.data?.message || "Gửi đánh giá thất bại");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 font-semibold text-gray-800">Viết đánh giá</div>
      <div className="mb-2 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            onClick={() => setRating(i + 1)}
            className={`h-5 w-5 cursor-pointer ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setFiles(e.target.files)}
        className="rounded border p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-orange-500 file:px-3 file:py-1 file:text-white hover:file:bg-orange-600"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Chia sẻ cảm nhận của bạn…"
        className="mt-3 min-h-[100px] w-full rounded-xl border p-3 outline-none ring-orange-200 focus:ring-2"
      />
      <button
        onClick={submit}
        disabled={sending}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 font-semibold text-white hover:from-orange-600 hover:to-amber-500 disabled:opacity-50"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        Gửi đánh giá
      </button>
    </div>
  );
}

function ReviewList({ items }) {
  if (!items?.length) return <div className="rounded-2xl bg-white p-4 text-gray-500">Chưa có đánh giá nào.</div>;
  return (
    <div className="grid gap-3">
      {items.map((r) => (
        <div key={r.id} className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span className="font-medium">{r.username || "Ẩn danh"}</span>
            <span>•</span>
            <span>{new Date(r.created_at).toLocaleString("vi-VN")}</span>
          </div>
          <div className="mb-1 flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < (r.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
            ))}
          </div>
          <div className="text-gray-800 whitespace-pre-line">{r.content}</div>
          {Array.isArray(r.images) && r.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {r.images.map((u, idx) => (
                <img key={idx} src={buildImg(u)} alt="" className="h-20 w-20 rounded-lg border object-cover" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Helper: tự tính summary khi API không trả ---------- */
function computeSummaryFromList(list) {
  const items = Array.isArray(list) ? list : [];
  const count = items.length;
  if (!count) {
    return { avg: 0, count: 0, hist: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }
  const hist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  for (const r of items) {
    const k = Math.max(1, Math.min(5, Number(r.rating) || 0));
    sum += k;
    hist[k] = (hist[k] || 0) + 1;
  }
  return { avg: sum / count, count, hist };
}

/* ---------- Main component ---------- */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [range, setRange] = useState(null);
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  // giữ ổn định hook order
  const reviewStats = useMemo(
    () => ({ avg: Number(summary?.avg || 0), count: Number(summary?.count || 0) }),
    [summary]
  );

  const reloadReviews = async () => {
    try {
      const { data } = await api.get(`/api/products/${id}/reviews`);
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setReviews(items);
      const sum = data?.summary || computeSummaryFromList(items);
      setSummary(sum);
    } catch (e) {
      console.error("Reload reviews error:", e?.response?.data || e);
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const pRes = await api.get(`/api/products/${id}`);
        if (!mounted) return;
        const p = pRes.data;
        setProduct(p);

        const sellerId = p?.seller_id ?? p?.user_id ?? null;

        const [rRes, prRes, sRes] = await Promise.all([
          api.get(`/api/products/${id}/reviews`).catch(() => ({ data: [] })),
          api.get(`/api/products/${id}/price-range?months=3`).catch(() => ({ data: null })),
          sellerId
            ? api.get(`/api/sellers/${sellerId}/metrics`).catch(() => ({ data: null }))
            : Promise.resolve({ data: null }),
        ]);

        if (!mounted) return;

        const rData = rRes?.data || {};
        const rItems = Array.isArray(rData.items) ? rData.items : (Array.isArray(rData) ? rData : []);
        setReviews(rItems);
        setSummary(rData.summary || computeSummaryFromList(rItems));

        setRange(prRes?.data || null);
        setSeller(sRes?.data || null);
      } catch (e) {
        console.error("Load detail error:", e?.response?.data || e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [id]);

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải sản phẩm...
      </div>
    );
  if (!product)
    return (
      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border bg-red-50 p-6 text-center text-red-600">
        Không tìm thấy sản phẩm.
      </div>
    );

  const inStock = product.quantity > 0 || product.is_available === true;

  const createOrder = async () => {
    try {
      const { data } = await api.post("/api/orders", {
        product_id: Number(id),
        quantity: 1,
      });
      if (data?.order?.id) {
        navigate(`/orders/buyer?highlight=${data.order.id}`);
      } else {
        alert("Tạo đơn thành công!");
      }
    } catch (e) {
      alert(e?.response?.data?.message || "Không thể tạo đơn");
    }
  };

  return (
    <motion.div
      className="mx-auto mt-6 max-w-6xl rounded-2xl bg-white p-6 shadow-lg"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-gray-800">{product.name}</h1>
          <StatusBadge status={product.status} inStock={inStock} />
        </div>
        <div className="text-3xl font-extrabold text-orange-600">
          {Number(product.price || 0).toLocaleString("vi-VN")} đ
        </div>
      </div>

      {/* TOP GRID */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <img
            src={buildImg(product.image_url)}
            alt={product.name}
            className="w-full max-h-[480px] rounded-2xl border-2 border-amber-200 object-cover shadow-md"
            onError={(e) => (e.currentTarget.src = "/logo.png")}
          />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <PriceRangeCard range={range} />
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="font-semibold text-gray-800 mb-2">Chi tiết sản phẩm</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                <div className="text-gray-500">Danh mục</div>
                <div className="font-medium">{product.category_name || "—"}</div>

                <div className="text-gray-500">Tình trạng</div>
                <div className="font-medium">{product.condition || "Không rõ"}</div>

                <div className="text-gray-500">Bảo hành</div>
                <div className="font-medium">{product.warranty || "Không"}</div>

                <div className="text-gray-500">Kho</div>
                <div className="font-medium">
                  {typeof product.quantity === "number" ? product.quantity : (inStock ? "Còn hàng" : "Hết hàng")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Description */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-1 text-lg font-semibold text-gray-800">Mô tả sản phẩm</div>
            <p className="rounded-xl bg-gray-50/60 p-3 text-gray-700 shadow-inner whitespace-pre-line">
              {product.description || "Không có mô tả."}
            </p>
          </div>

          {/* Seller */}
          {seller && <SellerCard seller={seller} reviewStats={reviewStats} />}

          {/* Actions */}
          <div className="flex flex-col gap-3 md:flex-row">
            <button
              onClick={createOrder}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-2 text-white shadow hover:from-orange-600 hover:to-amber-500 transition"
            >
              <ShoppingCart className="h-5 w-5" /> Tạo yêu cầu mua
            </button>
            <Link
              to="/messages"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-orange-400 px-5 py-2 text-orange-600 hover:bg-orange-50 transition"
            >
              <MessageCircle className="h-5 w-5" /> Nhắn tin
            </Link>
          </div>
        </div>
      </div>

      {/* RATING + REVIEWS */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <RatingSummary summary={summary} />
          <div className="mt-3 text-xs text-gray-500">
            Điểm đánh giá dựa trên các nhận xét đã xác minh.
          </div>
        </div>
        <div className="md:col-span-2 grid gap-4">
          <ReviewForm productId={id} onDone={reloadReviews} />
          <ReviewList items={reviews} />
        </div>
      </div>
    </motion.div>
  );
}
