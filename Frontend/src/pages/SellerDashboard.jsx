import api from "@/lib/api";
import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCw,
  PlusCircle,
  Edit,
  RefreshCcw,
  Clock,
  Trash2,
  Eye,
  Heart,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ClipboardList,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SellerDashboard() {
  const { user, token } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [orderModal, setOrderModal] = useState({ open: false, data: null, updating: false });

  // ======================== FETCH PRODUCTS ========================
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get("/api/products/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];
      setPosts(data);
      setFiltered(data);
      setStats({
        total: data.length,
        active: data.filter((p) => p.status === "active").length,
        expired: data.filter((p) => p.status !== "active").length,
      });
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchData();
  }, [fetchData, token]);

  // ======================== FILTER + SORT ========================
  useEffect(() => {
    let list = [...posts];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.price).includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active") list = list.filter((p) => p.status === "active");
    if (statusFilter === "expired") list = list.filter((p) => p.status !== "active");

    list.sort((a, b) =>
      sortOrder === "asc"
        ? Number(a.price) - Number(b.price)
        : Number(b.price) - Number(a.price)
    );

    setFiltered(list);
  }, [query, posts, statusFilter, sortOrder]);

  // ======================== ACTIONS ========================
  const handleRenew = async (id) => {
    try {
      await api.post(`/api/products/${id}/renew`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("⏰ Gia hạn tin thành công!");
      fetchData();
    } catch {
      toast.error("Không thể gia hạn tin");
    }
  };

  const handleRefresh = async (id) => {
    try {
      await api.put(`/api/products/${id}`, { updated_at: new Date() }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("🔁 Làm mới tin thành công!");
      fetchData();
    } catch {
      toast.error("Không thể làm mới tin");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa tin này?")) return;
    try {
      await api.delete(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("🗑️ Đã xóa tin!");
      fetchData();
    } catch {
      toast.error("Không thể xóa tin");
    }
  };

  const toggleLike = async (id, liked) => {
    try {
      await api.post(`/api/seller/orders/like/${id}`, { liked: !liked }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch {
      toast.error("Không thể cập nhật lượt thích");
    }
  };

  const openOrderDetailByProduct = async (productId) => {
    try {
      const { data } = await api.get(`/api/seller/orders/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.length === 0) {
        toast("❌ Sản phẩm này chưa có đơn hàng nào.");
        return;
      }
      setOrderModal({ open: true, data });
    } catch {
      toast.error("Không thể tải đơn hàng của sản phẩm này");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      setOrderModal((prev) => ({ ...prev, updating: true }));
      await api.patch(`/api/seller/orders/${orderId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Cập nhật trạng thái thành công!");
      setOrderModal({ open: false, data: null, updating: false });
    } catch {
      toast.error("Không thể cập nhật trạng thái");
      setOrderModal((prev) => ({ ...prev, updating: false }));
    }
  };

  // ======================== UI ========================
  if (!user)
    return <div className="text-center py-20 text-gray-600">Vui lòng đăng nhập để xem bảng điều khiển.</div>;
  if (loading)
    return <div className="text-center py-20 text-gray-500 animate-pulse">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8">
        <h1 className="text-3xl font-extrabold text-blue-600 flex items-center gap-2">
          <span>📊</span> Bảng điều khiển người bán
        </h1>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 shadow-sm hover:bg-gray-50 transition"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Đang làm mới..." : "Làm mới"}
          </button>
          <Link
            to="/post/create"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white px-4 py-2 rounded-xl hover:brightness-105 shadow"
          >
            <PlusCircle className="w-5 h-5" /> Đăng tin mới
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Tổng số tin", value: stats.total, color: "from-blue-50 to-blue-100", text: "text-blue-700" },
          { label: "Đang hiển thị", value: stats.active, color: "from-emerald-50 to-emerald-100", text: "text-emerald-700" },
          { label: "Hết hạn / Ẩn", value: stats.expired, color: "from-gray-50 to-gray-100", text: "text-gray-700" },
        ].map((s, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -3, scale: 1.02 }}
            className={`bg-gradient-to-br ${s.color} rounded-2xl p-6 shadow-sm ring-1 ring-gray-100`}
          >
            <p className="text-sm text-gray-500">{s.label}</p>
            <h3 className={`text-4xl font-bold mt-1 ${s.text}`}>{s.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, giá hoặc mô tả..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded-xl px-3 py-2 w-full sm:w-80 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-xl px-2 py-1 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hiển thị</option>
              <option value="expired">Hết hạn / Ẩn</option>
            </select>
          </div>
          <button
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="flex items-center gap-1 border rounded-xl px-2 py-1 hover:bg-gray-50 transition"
          >
            {sortOrder === "asc" ? (
              <>
                <SortAsc className="w-4 h-4" /> Giá ↑
              </>
            ) : (
              <>
                <SortDesc className="w-4 h-4" /> Giá ↓
              </>
            )}
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ y: -3, scale: 1.02 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group transition"
          >
            <img
              src={p.image_url || "/placeholder.png"}
              alt={p.name}
              className="w-full h-40 object-cover"
            />
            <div className="absolute top-2 right-2 flex items-center gap-2 text-sm text-gray-700">
              <span className="flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-full shadow-sm">
                <Eye size={15} /> {p.view_count || 0}
              </span>
              <button
                onClick={() => toggleLike(p.id, p.liked)}
                className="flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-full hover:text-red-500 transition"
              >
                <Heart size={15} fill={p.liked ? "red" : "none"} />{" "}
                {p.like_count || 0}
              </button>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
              <p className="text-blue-600 font-bold mt-1">
                {Number(p.price).toLocaleString("vi-VN")} ₫
              </p>
              <p
                className={`text-sm mt-1 ${
                  p.status === "active"
                    ? "text-emerald-600"
                    : "text-gray-500 italic"
                }`}
              >
                {p.status === "active" ? "Đang hiển thị" : "Đã ẩn / Hết hạn"}
              </p>

              <div className="flex flex-wrap gap-2 mt-3 text-sm">
                <Link
                  to={`/post/edit/${p.id}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Edit size={15} /> Sửa
                </Link>
                <button
                  onClick={() => handleRefresh(p.id)}
                  className="flex items-center gap-1 text-sky-500 hover:underline"
                >
                  <RefreshCcw size={15} /> Làm mới
                </button>
                <button
                  onClick={() => handleRenew(p.id)}
                  className="flex items-center gap-1 text-indigo-500 hover:underline"
                >
                  <Clock size={15} /> Gia hạn
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="flex items-center gap-1 text-red-600 hover:underline"
                >
                  <Trash2 size={15} /> Xóa
                </button>
                <button
                  onClick={() => openOrderDetailByProduct(p.id)}
                  className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition"
                >
                  <ClipboardList size={15} /> Đơn hàng
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal chi tiết đơn hàng */}
      <AnimatePresence>
        {orderModal.open && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 relative"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <button
                onClick={() => setOrderModal({ open: false, data: null })}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-800"
              >
                <X />
              </button>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-600">
                <ClipboardList className="w-5 h-5" /> Chi tiết đơn hàng
              </h2>

              {orderModal.data ? (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    👤 Người mua:{" "}
                    <b>{orderModal.data[0]?.buyer_name}</b> –{" "}
                    {orderModal.data[0]?.buyer_phone}
                  </p>
                  <div className="border-t border-gray-200 mt-3 pt-3 max-h-60 overflow-y-auto">
                    {orderModal.data.map((i, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between py-2 border-b text-sm"
                      >
                        <span>{i.product_name}</span>
                        <span className="text-gray-600">
                          {Number(i.total_amount).toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-right font-semibold mt-3 text-blue-600">
                    Tổng cộng:{" "}
                    {orderModal.data
                      .reduce((a, b) => a + Number(b.total_amount), 0)
                      .toLocaleString("vi-VN")}{" "}
                    ₫
                  </p>
                  <div className="flex justify-between items-center mt-5">
                    <span className="text-sm text-gray-600">
                      Trạng thái:{" "}
                      <b className="capitalize">
                        {orderModal.data[0]?.status}
                      </b>
                    </span>
                    <select
                      disabled={orderModal.updating}
                      onChange={(e) =>
                        updateOrderStatus(orderModal.data[0]?.id, e.target.value)
                      }
                      className="border rounded-xl px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        — Cập nhật trạng thái —
                      </option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="shipped">Đang giao</option>
                      <option value="completed">Hoàn tất</option>
                      <option value="canceled">Đã hủy</option>
                    </select>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500">
                  Đang tải chi tiết...
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
