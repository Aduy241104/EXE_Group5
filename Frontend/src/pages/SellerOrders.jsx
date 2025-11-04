import api from "@/lib/api";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  RefreshCcw,
  Eye,
  PackageCheck,
  XCircle,
  CheckCircle,
  Truck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_LABEL = {
  pending: "⏳ Chờ xác nhận",
  confirmed: "✅ Đã xác nhận",
  shipped: "🚚 Đang giao",
  completed: "🎉 Hoàn tất",
  canceled: "❌ Đã hủy",
};

const STATUS_COLOR = {
  pending: "text-amber-500",
  confirmed: "text-blue-500",
  shipped: "text-cyan-500",
  completed: "text-green-600",
  canceled: "text-red-500",
};

export default function SellerOrders() {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/api/seller/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(data);
    } catch {
      toast.error("Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(
        `/api/seller/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Cập nhật trạng thái thành công!");
      fetchOrders();
    } catch {
      toast.error("Không thể cập nhật đơn");
    }
  };

  const openDetail = async (orderId) => {
    setSelected(orderId);
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/api/seller/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetails(data);
    } catch {
      toast.error("Không thể tải chi tiết đơn hàng");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    setSelected(null);
    setDetails([]);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-80 text-gray-500">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> Đang tải đơn hàng...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-orange-600 mb-8 flex items-center gap-2">
        🧾 Quản lý đơn bán
      </h1>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-10">
          Bạn chưa có đơn hàng nào.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <motion.div
              key={o.id}
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-xl shadow border p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
            >
              <div>
                <p className="font-semibold text-gray-800">
                  Mã đơn: <span className="text-gray-600">{o.id}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Người mua: {o.buyer_name} ({o.buyer_phone})
                </p>
                <p className={`font-medium ${STATUS_COLOR[o.status]} mt-1`}>
                  {STATUS_LABEL[o.status]}
                </p>
                <p className="text-sm text-gray-400">
                  Tổng: {Number(o.total_amount).toLocaleString()} ₫
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openDetail(o.id)}
                  className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <Eye size={16} /> Xem
                </button>
                <button
                  onClick={() => updateStatus(o.id, "confirmed")}
                  className="px-3 py-1 border rounded text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                >
                  <CheckCircle size={16} /> Xác nhận
                </button>
                <button
                  onClick={() => updateStatus(o.id, "shipped")}
                  className="px-3 py-1 border rounded text-cyan-600 hover:bg-cyan-50 flex items-center gap-1"
                >
                  <Truck size={16} /> Giao hàng
                </button>
                <button
                  onClick={() => updateStatus(o.id, "completed")}
                  className="px-3 py-1 border rounded text-green-600 hover:bg-green-50 flex items-center gap-1"
                >
                  <PackageCheck size={16} /> Hoàn tất
                </button>
                <button
                  onClick={() => updateStatus(o.id, "canceled")}
                  className="px-3 py-1 border rounded text-red-600 hover:bg-red-50 flex items-center gap-1"
                >
                  <XCircle size={16} /> Hủy
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal chi tiết */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative"
            >
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-4">
                Chi tiết đơn hàng #{selected}
              </h2>

              {loadingDetail ? (
                <div className="flex justify-center py-10 text-gray-500">
                  <Loader2 className="animate-spin w-5 h-5 mr-2" /> Đang tải...
                </div>
              ) : details.length === 0 ? (
                <p className="text-gray-500">Không có dữ liệu.</p>
              ) : (
                <div className="space-y-2">
                  {details.map((d, i) => (
                    <div
                      key={i}
                      className="flex justify-between border-b py-2 text-sm"
                    >
                      <span>{d.product_name}</span>
                      <span>
                        {d.quantity} × {Number(d.price).toLocaleString()} ₫
                      </span>
                    </div>
                  ))}
                  <p className="text-right font-bold text-gray-700 mt-4">
                    Tổng:{" "}
                    {details
                      .reduce((s, x) => s + Number(x.subtotal || 0), 0)
                      .toLocaleString()}{" "}
                    ₫
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
