import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Eye, Edit2, Trash2, RefreshCcw } from "lucide-react";

// ảnh fallback đơn giản, nếu bạn đã có util buildImg thì thay vào
const buildImg = (u) => {
  if (!u) return "/logo.png";
  if (/^https?:\/\//i.test(u)) return u;
  return `${import.meta.env.VITE_API || "http://localhost:5000"}/${u.replace(/^\/+/, "")}`;
};

export default function PostTable({ items, loading, onRefresh }) {
  const navigate = useNavigate();

  const del = async (id) => {
    if (!confirm("🗑️ Bạn có chắc muốn xoá bài đăng này?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      onRefresh?.();
    } catch (err) {
      console.error("❌ Xoá thất bại:", err);
      alert(err?.response?.data?.error || "Không thể xoá sản phẩm");
    }
  };

  const renew = async (id) => {
    try {
      await api.post(`/api/products/${id}/renew`);
      alert("🔁 Gia hạn thành công!");
      onRefresh?.();
    } catch (err) {
      console.error("❌ Gia hạn thất bại:", err);
      alert(err?.response?.data?.error || "Không thể gia hạn sản phẩm");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border bg-gray-50" />
        ))}
      </div>
    );
  }
  if (!items?.length) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
        Bạn chưa có bài đăng nào. Hãy bấm <b>Đăng tin mới</b> để bán món đồ đầu tiên nhé!
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border shadow-sm">
      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-[1] bg-gray-50 text-gray-700 shadow-sm">
            <tr>
              <th className="p-3 text-left font-semibold">Sản phẩm</th>
              <th className="p-3 text-center font-semibold">Giá</th>
              <th className="p-3 text-center font-semibold">Trạng thái</th>
              <th className="p-3 text-center font-semibold">Lượt xem</th>
              <th className="p-3 text-center font-semibold">Yêu thích</th>
              <th className="p-3 text-center font-semibold">Tin nhắn</th>
              <th className="p-3 text-center font-semibold">Đơn hàng</th>
              <th className="p-3 text-center font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-gray-50/40">
            {items.map((p) => (
              <tr key={p.id} className="border-t transition hover:bg-orange-50/40">
                {/* Sản phẩm */}
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={buildImg(p.thumbnail_url)}
                      className="h-16 w-16 rounded-xl border object-cover"
                      onError={(e) => { e.currentTarget.src = "/logo.png"; }}
                      alt={p.title}
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/products/${p.id}`}
                        className="line-clamp-1 font-medium text-gray-800 hover:text-orange-600 hover:underline"
                        title={p.title}
                      >
                        {p.title}
                      </Link>
                      <div className="text-xs text-gray-500">
                        {new Date(p.created_at).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Giá */}
                <td className="p-3 text-center font-semibold text-gray-800">
                  {Number(p.price || 0).toLocaleString("vi-VN")}đ
                </td>

                {/* Trạng thái */}
                <td className="p-3 text-center">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      p.status === "active"
                        ? "bg-green-100 text-green-700"
                        : p.status === "sold"
                        ? "bg-blue-100 text-blue-700"
                        : p.status === "expired"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>

                {/* Stats */}
                <td className="p-3 text-center">{p.views || 0}</td>
                <td className="p-3 text-center">{p.favorites || 0}</td>
                <td className="p-3 text-center">{p.messages || 0}</td>
                <td className="p-3 text-center">{p.orders || 0}</td>

                {/* Hành động */}
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => navigate(`/post/edit/${p.id}`)}
                      title="Chỉnh sửa"
                      className="rounded p-2 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => del(p.id)}
                      title="Xoá"
                      className="rounded p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => renew(p.id)}
                      title="Gia hạn tin"
                      className="rounded p-2 text-amber-600 hover:bg-amber-50"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/products/${p.id}`}
                      title="Xem chi tiết"
                      className="rounded p-2 text-gray-700 hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* footer nhỏ */}
      <div className="border-t bg-white p-3 text-right text-xs text-gray-500">
        Tổng: <b>{items.length}</b> bài
      </div>
    </div>
  );
}
