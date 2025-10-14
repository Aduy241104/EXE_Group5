// src/pages/BuyerOrders.jsx
import api from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Package, Hash, CalendarClock, Truck, XCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/logo.png";

const fmtVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n || 0));

const STATUS_MAP = {
  pending: { label: "Chờ xác nhận", color: "bg-gray-200 text-gray-800" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
  shipped: { label: "Đang giao", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Hoàn tất", color: "bg-green-100 text-green-700" },
  canceled: { label: "Đã huỷ", color: "bg-red-100 text-red-700" },
};

const normalizeImg = (raw) => {
  if (!raw) return PLACEHOLDER;
  let s = String(raw).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s)) return s;
  s = s.replace(/^\/?uploads\//i, "");
  if (!/^[^/]+\/[^/]+/.test(s)) s = `products/${s}`;
  return `${API}/uploads/${s}`;
};

export default function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/orders/buyer");
        setOrders(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [orders]
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-500">
        Đang tải danh sách đơn hàng...
      </div>
    );
  if (!orders.length)
    return (
      <div className="text-center mt-10 text-gray-600">
        <p>📭 Bạn chưa có đơn hàng nào.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 p-5 text-white shadow">
        <h1 className="text-2xl font-extrabold drop-shadow">📦 Đơn hàng của bạn</h1>
        <p className="text-white/90">Theo dõi trạng thái & chi tiết các đơn hàng gần đây</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paged.map((o) => {
          const first = o.items?.[0];
          const name = o.product?.name || first?.product_name || "Sản phẩm";
          const desc = o.product?.description || first?.description || "";
          const img = normalizeImg(first?.image_url || o.product?.image_url);
          const price = o.product?.price ?? first?.price ?? 0;
          const total =
            o.total_price ?? o.items?.reduce((s, it) => s + it.price * it.quantity, 0);
          const status = STATUS_MAP[o.status] || STATUS_MAP.pending;

          return (
            <div
              key={o.order_id}
              className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <img
                  src={img}
                  alt={name}
                  className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                  onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                />
                <span
                  className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h2 className="font-semibold text-lg line-clamp-1 text-gray-800">
                    {name}
                  </h2>
                  {!!desc && (
                    <p className="text-gray-500 text-sm line-clamp-2 mt-1">{desc}</p>
                  )}
                </div>

                <ul className="mt-3 space-y-1 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <BadgeDollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium">Giá:</span> {fmtVND(price)}
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium">Số SP:</span> {o.items?.length || 1}
                  </li>
                  <li className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Tổng tiền:</span> {fmtVND(total)}
                  </li>
                </ul>

                <p className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <CalendarClock className="h-4 w-4" />
                  {new Date(o.created_at).toLocaleString("vi-VN")}
                </p>
              </div>

              <div className="border-t bg-gray-50 p-3 text-right">
                {o.status === "shipped" && (
                  <button className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-1.5 text-white font-medium hover:from-orange-600 hover:to-amber-500 flex items-center gap-2 ml-auto">
                    <Truck className="h-4 w-4" /> Xem vận chuyển
                  </button>
                )}
                {o.status === "pending" && (
                  <button className="rounded-lg border border-red-400 px-4 py-1.5 text-red-500 hover:bg-red-50 font-medium flex items-center gap-2 ml-auto">
                    <XCircle className="h-4 w-4" /> Huỷ đơn
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border px-3 py-1 disabled:opacity-50"
          >
            «
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`rounded-lg border px-3 py-1 ${
                page === i + 1
                  ? "bg-orange-500 text-white border-orange-500"
                  : "hover:bg-gray-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border px-3 py-1 disabled:opacity-50"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
