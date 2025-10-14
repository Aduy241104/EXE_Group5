// src/components/product/SellerCard.jsx
import { Link } from "react-router-dom";
import {
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";

/* ---------- Utils (giữ cách build ảnh y như ProductDetail) ---------- */
const API =
  import.meta.env.VITE_API ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const buildImg = (u) => {
  if (!u) return "/logo.png";
  if (/^https?:\/\//i.test(u)) return u;
  return `${API}/${String(u).replace(/^\/+/, "")}`;
};

/* ---------- Seller card (y nguyên logic trước đó) ---------- */
export default function SellerCard({ seller, reviewStats }) {
  const avg = Number(
    (reviewStats && reviewStats.avg) ??
      seller?.avg_rating ??
      0
  );
  const total = Number(
    (reviewStats && reviewStats.count) ??
      seller?.reviews_count ??
      0
  );

  return (
    <div className="rounded-2xl border bg-orange-50/40 p-5 shadow-inner">
      <div className="mb-3 flex items-center gap-3">
        <img
          src={buildImg(seller?.avatar_url)}
          className="h-14 w-14 rounded-full border-2 border-amber-300 object-cover"
          onError={(e) => (e.currentTarget.src = "/logo.png")}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${seller?.id}`} className="truncate text-lg font-semibold text-gray-800 hover:text-orange-600">
              {seller?.username || "Người bán"}
            </Link>
            <ShieldCheck className="h-4 w-4 text-emerald-600" title="Đã xác minh" />
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Phone className="h-4 w-4 text-orange-500" />
            <span>{seller?.phone || "Chưa có số"}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-orange-500" />
          Tỉ lệ phản hồi: <b>{Math.round(Number(seller?.response_rate || 0))}%</b>
        </div>
        <div className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-orange-500" />
          Tốc độ phản hồi: <b>{Math.round((seller?.response_time_sec || 0) / 60)} phút</b>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          Đánh giá trung bình: <b>{avg.toFixed(1)}/5</b>
          <span className="text-gray-500">({total})</span>
        </div>
        <div className="md:col-span-2 lg:col-span-3 mt-1 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-500" />
          <span>{seller?.address || "Địa chỉ: chưa cập nhật"}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Link to={`/profile/${seller?.id}`} className="rounded-xl border border-orange-400 px-4 py-2 text-orange-600 hover:bg-orange-50">
          Xem hồ sơ
        </Link>
        <Link to="/messages" className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 font-semibold text-white hover:from-orange-600 hover:to-amber-500">
          Nhắn tin
        </Link>
      </div>
    </div>
  );
}
