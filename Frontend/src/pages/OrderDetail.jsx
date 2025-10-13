import api from "@/lib/api";
import { useContext, useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";

import { AuthContext } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/logo.png";

// === Chuẩn hoá ảnh giống các trang khác
const isAbs = (u) => /^https?:\/\//i.test(u || "");
const buildImg = (raw) => {
  if (!raw) return PLACEHOLDER;
  const s = String(raw);
  if (isAbs(s)) return s;
  if (s.startsWith("/uploads/")) return `${API}${s}`;
  if (s.startsWith("uploads/")) return `${API}/${s}`;
  return `${API}/uploads/${s}`;
};

export default function OrderDetail() {
  const { id } = useParams();
  const { user, token, loadingUser } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");

  const [showDispute, setShowDispute] = useState(false);
  const [dTitle, setDTitle] = useState("");
  const [dReason, setDReason] = useState("");
  const [dImages, setDImages] = useState([""]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`http://localhost:5000/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(res.data);
      } catch (err) {
        console.error("❌ Lỗi lấy chi tiết đơn:", err);
        toast.error("Không thể tải đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchOrder();
    else setLoading(false);
  }, [id, token]);

  const canOpenDispute = (() => {
    if (!order || !user) return false;
    const isBuyerOrSeller = [order.buyer_id, order.seller_id].includes(user.id);
    if (!isBuyerOrSeller) return false;
    if (order.status === "cancelled") return false;
    return true;
  })();

  const submitDispute = async () => {
    if (!dTitle.trim() || !dReason.trim()) {
      toast.error("Nhập tiêu đề và lý do khiếu nại.");
      return;
    }
    try {
      await api.post(
        "http://localhost:5000/api/disputes",
        {
          order_id: Number(id),
          title: dTitle,
          reason: dReason,
          evidence_urls: dImages.filter(Boolean),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã tạo khiếu nại!");
      setShowDispute(false);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Tạo khiếu nại thất bại");
    }
  };

  if (loadingUser) {
    return <p className="text-center py-10">Đang xác thực người dùng...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (loading) {
    return <p className="text-center py-10">Đang tải...</p>;
  }
  if (!order) {
    return <p className="text-center py-10">Không tìm thấy đơn hàng.</p>;
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN").format(val || 0) + " ₫";

  const grouped = (order.items || []).reduce((acc, item) => {
    const found = acc.find((i) => i.product_id === item.product_id);
    if (found) {
      found.quantity += item.quantity;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl font-bold mb-6 text-orange-600">
          📦 Chi tiết đơn hàng
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {grouped.map((it) => (
              <div
                key={it.product_id}
                className="flex gap-4 items-start border-b pb-4"
              >
                <img
                  src={buildImg(it.image_url)}
                  alt={it.product_name}
                  className="w-24 h-24 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{it.product_name}</h2>
                  <p className="text-gray-600">{it.description}</p>
                  <p className="mt-1">
                    <span className="font-medium">Số lượng:</span>{" "}
                    {it.quantity}
                  </p>
                  <p>
                    <span className="font-medium">Đơn giá:</span>{" "}
                    {formatCurrency(it.price)}
                  </p>
                  <p>
                    <span className="font-medium">Tổng:</span>{" "}
                    {formatCurrency(it.price * it.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 space-y-2">
            <p>
              <span className="font-medium">Trạng thái:</span>{" "}
              <span className="uppercase text-blue-600">{order.status}</span>
            </p>
            <p>
              <span className="font-medium">Tổng hóa đơn:</span>{" "}
              {formatCurrency(
                grouped.reduce((sum, i) => sum + i.quantity * i.price, 0)
              )}
            </p>
            <div className="pt-3 border-t">
              <h3 className="font-semibold">👤 Người mua</h3>
              <p>{order.buyer_name || "-"}</p>
              <p>{order.buyer_phone || "-"}</p>
            </div>
            <div className="pt-3 border-t">
              <h3 className="font-semibold">🏪 Người bán</h3>
              <p>{order.seller_name || "-"}</p>
              <p>{order.seller_phone || "-"}</p>
            </div>

            {user.id === order.seller_id && (
              <div className="mt-4">
                <label className="block mb-1 font-medium">
                  Cập nhật trạng thái:
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="border px-3 py-2 rounded flex-1"
                  >
                    <option value="">-- Chọn trạng thái --</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="shipped">Đang giao</option>
                    <option value="completed">Hoàn tất</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                  <button
                    onClick={() => {
                      // xử lý update
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            )}

            {canOpenDispute && (
              <div className="pt-4 border-t">
                <button
                  onClick={() => setShowDispute(true)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  ⚠️ Mở khiếu nại
                </button>
              </div>
            )}

            {showDispute && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                  <h3 className="text-lg font-semibold mb-3">Mở khiếu nại</h3>
                  <label className="block text-sm mb-1">Tiêu đề</label>
                  <input
                    value={dTitle}
                    onChange={(e) => setDTitle(e.target.value)}
                    className="w-full border px-3 py-2 rounded mb-3"
                    placeholder="VD: Hàng bị lỗi, thiếu phụ kiện..."
                  />
                  <label className="block text-sm mb-1">Lý do chi tiết</label>
                  <textarea
                    value={dReason}
                    onChange={(e) => setDReason(e.target.value)}
                    className="w-full border px-3 py-2 rounded mb-3 h-28"
                  />
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Ảnh chứng cứ (URL)</span>
                      <button
                        className="text-blue-600 text-sm"
                        onClick={() => setDImages((arr) => [...arr, ""])}
                      >
                        + thêm ảnh
                      </button>
                    </div>
                    {dImages.map((u, idx) => (
                      <input
                        key={idx}
                        value={u}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDImages((arr) =>
                            arr.map((x, i) => (i === idx ? v : x))
                          );
                        }}
                        className="w-full border px-3 py-2 rounded mb-2"
                        placeholder="https://..."
                      />
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowDispute(false)}
                      className="px-4 py-2 rounded border"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={submitDispute}
                      className="px-4 py-2 rounded bg-red-600 text-white"
                    >
                      Gửi khiếu nại
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
