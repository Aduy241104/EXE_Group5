// src/pages/BuyerOrders.jsx
import api from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Package, Hash, CalendarClock } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/logo.png"; // fallback local

const fmtVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(n || 0)
  );

const STATUS_VI = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipped: "Đang giao",
  completed: "Hoàn tất",
  canceled: "Đã hủy",
};

// === Chuẩn hoá ảnh: http(s) | "/uploads/..." | "uploads/..." | "products/..." | filename
const normalizeImg = (raw) => {
  if (!raw) return PLACEHOLDER;
  let s = String(raw).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s)) return s;        // URL tuyệt đối
  s = s.replace(/^\/?uploads\//i, "");           // bỏ tiền tố uploads/
  if (!/^[^/]+\/[^/]+/.test(s)) s = `products/${s}`; // nếu chỉ là filename -> mặc định products/
  return `${API}/uploads/${s}`;
};

const totalFromItems = (items = []) =>
  items.reduce(
    (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1),
    0
  );

export default function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 15;
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/orders/buyer");
        setOrders(data || []);
      } catch {
        /* toast/alert tuỳ bạn */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      ),
    [orders]
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(
    () => sorted.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
    [sorted, page]
  );

  if (loading) return <p className="text-center mt-10">Đang tải...</p>;
  if (!orders.length)
    return <p className="text-center mt-10">Bạn chưa có đơn hàng nào.</p>;

  return (
    <div className="container mx-auto px-6 py-8 pb-20">
      <h1 className="text-2xl font-bold mb-6">📦 Đơn hàng của bạn</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {paged.map((o) => {
          const first = o.items?.[0];
          const img = normalizeImg(first?.image_url || o.product?.image_url);
          const name = o.product?.name || first?.product_name || "Sản phẩm";
          const desc = o.product?.description || first?.description || "";
          const price = o.product?.price ?? first?.price ?? null;
          const total = o.total_price ?? totalFromItems(o.items);
          const label = STATUS_VI[o.status] || o.status;

          return (
            <article
              key={o.order_id}
              className="group bg-white shadow-sm hover:shadow-md transition rounded-xl overflow-hidden ring-1 ring-gray-100"
            >
              <div className="relative w-full aspect-square overflow-hidden">
                <img
                  src={img}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                />
                <span className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-gray-800/80 text-white">
                  {label}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h2 className="font-semibold text-base line-clamp-1">{name}</h2>
                {!!desc && (
                  <p className="text-gray-500 text-sm line-clamp-1">{desc}</p>
                )}
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
              className={`px-3 py-1 rounded border ${
                page === i + 1
                  ? "bg-orange-500 text-white border-orange-500"
                  : ""
              }`}
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
