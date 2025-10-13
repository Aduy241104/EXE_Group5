import api from '../lib/api';
import { useEffect, useMemo, useState } from "react";

import { toast } from "react-hot-toast";
import {
  Package,
  BadgeDollarSign,
  User2,
  Hash,
  CalendarClock,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const fmtVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n || 0));
const cap = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const STATUS_VI = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipped: "Đang giao",
  completed: "Hoàn tất",
  canceled: "Đã hủy",
};

const getStatusStyle = (status) => {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    case "confirmed":
      return "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
    case "shipped":
      return "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200";
    case "completed":
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    case "canceled":
      return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
    default:
      return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  }
};

const PLACEHOLDER = "https://via.placeholder.com/600x600.png?text=No+Image";
const normalizeImg = (raw) => {
  if (!raw) return PLACEHOLDER;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${API}/uploads/${raw}`;
};
const totalFromItems = (items = []) =>
  items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);

export default function BuyerOrders() {
  // ========== GIỮ NGUYÊN LOGIC CŨ ==========
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 5 cột × 3 hàng = 15 item / trang
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:5000/api/orders/buyer", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(res.data || []))
      .catch((err) => {
        console.error(err);
        toast.error("Không thể tải đơn hàng");
      })
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [orders]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  if (loading) return <p className="text-center mt-10">Đang tải...</p>;
  if (!orders.length) return <p className="text-center mt-10">Bạn chưa có đơn hàng nào.</p>;

  return (
    <div className="container mx-auto px-6 py-8 pb-20">
      <h1 className="text-2xl font-bold mb-6">📦 Đơn hàng của bạn</h1>

      {/* GRID 5 cột */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {paged.map((o) => {
          // ----- dữ liệu cũ -----
          const imgOld = o.product?.image_url;
          const nameOld = o.product?.name;
          const descOld = o.product?.description;
          const priceOld = o.product?.price;
          const totalOld = o.total_price;
          // ----- dữ liệu mới (grouped) -----
          const firstItem = o.items?.[0];
          const imgNew = firstItem?.image_url;
          const nameNew = firstItem?.product_name;
          const descNew = firstItem?.description;
          const priceNew = firstItem?.price;

          const img = normalizeImg(imgNew || imgOld);
          const name = nameOld || nameNew || "Sản phẩm";
          const desc = descOld || descNew || "";
          const price = priceOld ?? priceNew ?? null;
          const total = totalOld != null ? totalOld : totalFromItems(o.items);
          const label = STATUS_VI[o.status] || cap(o.status);

          return (
            <article key={o.order_id} className="group bg-white shadow-sm hover:shadow-md transition rounded-xl overflow-hidden ring-1 ring-gray-100">
              {/* ảnh + badge */}
              <div className="relative w-full aspect-square overflow-hidden">
                <img
                  src={img}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                />
                <span className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full ${getStatusStyle(o.status)}`}>
                  {label}
                </span>
              </div>

              {/* body */}
              <div className="p-4 space-y-2">
                <h2 className="font-semibold text-base line-clamp-1">{name}</h2>
                {!!desc && <p className="text-gray-500 text-sm line-clamp-1">{desc}</p>}

                <ul className="text-sm space-y-1">
                  {price != null && (
                    <li className="flex items-center gap-2">
                      <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium">Giá:</span>
                      <span>{fmtVND(price)}</span>
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium">Số SP:</span>
                    <span>{o.items?.length || 1}</span>
                  </li>
                  {total != null && (
                    <li className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-orange-600" />
                      <span className="font-medium">Tổng tiền:</span>
                      <span>{fmtVND(total)}</span>
                    </li>
                  )}
                </ul>

                <p className="text-xs text-gray-400 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  Đặt lúc: {new Date(o.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {/* Phân trang 1,2,3… */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            «
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded border ${page === i + 1 ? "bg-orange-500 text-white border-orange-500" : ""}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
