import api from '../lib/api';
import { useContext, useEffect, useState } from "react";

import { AuthContext } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const BuyerOrders = () => {
  const { user, token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const res = await api.get("http://localhost:5000/api/orders/buyer", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Gom sản phẩm trùng product_id
        const grouped = {};
        res.data.forEach((order) => {
          const key = order.product_id;
          if (!grouped[key]) {
            grouped[key] = { ...order, quantity: 0 };
          }
          grouped[key].quantity += order.quantity;
        });

        setOrders(Object.values(grouped));
      } catch (err) {
        console.error("❌ Lỗi khi lấy đơn hàng:", err);
        toast.error("Không thể tải đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, token]);

  if (!user) return <p className="text-center py-10">Bạn cần đăng nhập để xem đơn hàng.</p>;
  if (loading) return <p className="text-center py-10">⏳ Đang tải đơn hàng...</p>;

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">🧾 Đơn hàng của bạn</h1>

      {orders.length === 0 ? (
        <p>Chưa có đơn hàng nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div key={order.product_id} className="border rounded-lg p-4 shadow-md">
              <h2 className="text-xl font-semibold mb-2">{order.product_name}</h2>
              <img
                src={
                  order.image_url?.includes("http")
                    ? order.image_url
                    : `http://localhost:5000/uploads/${order.image_url}`
                }
                alt={order.product_name}
                className="w-32 h-32 object-cover rounded mb-2"
              />
              <p>
                <span className="font-medium">Số lượng:</span> {order.quantity}
              </p>
              <p>
                <span className="font-medium">Trạng thái:</span> {order.status}
              </p>
              <p>
                <span className="font-medium">Người bán:</span> {order.seller_name} -{" "}
                {order.seller_phone}
              </p>
              <p className="text-sm text-gray-500">
                Đặt lúc: {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyerOrders;
