import api from '../../lib/api';
import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);

// ---- Modal Sửa đơn giản ----
function EditModal({ open, onClose, product, onSaved }) {
  const { token } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    price: product?.price ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? "",
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const { data } = await api.put(
        `${API}/api/products/${product.id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã cập nhật sản phẩm");
      onSaved?.(data);
      onClose();
    } catch (err) {
      console.error("❌ Lỗi cập nhật sản phẩm:", err);
      toast.error("Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded p-5">
        <h3 className="text-lg font-semibold mb-4">Sửa sản phẩm</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Tên"
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            name="price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={onChange}
            placeholder="Giá"
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            name="category_id"
            type="number"
            value={form.category_id}
            onChange={onChange}
            placeholder="Category ID"
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Mô tả"
            className="w-full border rounded px-3 py-2"
            rows={4}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductCard({
  product,
  onToggleFavorite,
  ownerView = false,   // true ở trang MyPosts
  onDeleted,
  onUpdated,
}) {
  const { user, token } = useContext(AuthContext);
  const [isFav, setIsFav] = useState(product.isFavorite || false);
  const [loading, setLoading] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const toggleFavorite = async () => {
    if (ownerView) return;
    if (!user) {
      toast.error("⚠️ Vui lòng đăng nhập để yêu thích sản phẩm.");
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      if (isFav) {
        await api.delete(
          `${API}/api/products/favorites/${product.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast("💔 Đã bỏ yêu thích");
        setIsFav(false);
        onToggleFavorite?.(product.id, true);
      } else {
        await api.post(
          `${API}/api/products/favorites/${product.id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("❤️ Đã thêm vào yêu thích");
        setIsFav(true);
        onToggleFavorite?.(product.id, false);
      }
    } catch (err) {
      console.error("❌ Lỗi toggle favorite:", err);
      toast.error("Không thể thay đổi trạng thái yêu thích.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    setLoading(true);
    try {
      await api.delete(`${API}/api/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa sản phẩm");
      onDeleted?.(product.id);
    } catch (err) {
      console.error("❌ Lỗi xóa sản phẩm:", err);
      toast.error(err?.response?.data?.error || "Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (updated) => {
    onUpdated?.(updated);
  };

  return (
    <div className="relative bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
      {/* Nút tim (ẩn trong ownerView) */}
      {!ownerView && (
        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 z-10 disabled:opacity-50"
          disabled={loading}
        >
          <Heart
            className={`w-7 h-7 transition-transform duration-300 ${
              isFav ? "fill-pink-500 text-pink-500 scale-110" : "text-gray-400"
            }`}
          />
        </button>
      )}

      {/* 🗑️ Nút xóa cho ADMIN ở danh sách chung */}
      {isAdmin && !ownerView && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="absolute top-3 left-3 z-10 bg-white/90 rounded-full p-1.5 shadow hover:bg-white disabled:opacity-50"
          title="Xóa (admin)"
        >
          <Trash2 className="w-5 h-5 text-red-600" />
        </button>
      )}

      <Link to={`/products/${product.id}`} className="block">
        <img
          src={product.image_url || "https://placehold.co/300x200?text=UniTrade"}
          alt={product.name}
          className="w-full h-40 object-cover"
        />
      </Link>

      <div className="p-4 flex flex-col">
        <h2 className="font-semibold text-lg line-clamp-1">{product.name}</h2>
        <p className="text-orange-600 font-bold">{formatPrice(product.price)}</p>

        {/* Sửa/Xóa cho chủ bài trong MyPosts */}
        {ownerView && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setOpenEdit(true)}
              className="px-3 py-2 rounded bg-yellow-500 text-white"
            >
              Sửa
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50"
            >
              Xóa
            </button>
          </div>
        )}
      </div>

      <EditModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        product={product}
        onSaved={handleSaved}
      />
    </div>
  );
}
