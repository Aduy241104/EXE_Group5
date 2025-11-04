import api from "@/lib/api";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { ArrowLeft, Save, UploadCloud } from "lucide-react";

export default function PostEdit() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    price: "",
    quantity: 1,
    description: "",
    image_url: "",
  });
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ================= FETCH PRODUCT =================
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/api/products/${id}`);
        setForm({
          name: data.name,
          price: data.price,
          quantity: data.quantity || 1,
          description: data.description || "",
          image_url: data.image_url || "",
        });
      } catch {
        toast.error("❌ Không thể tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.price <= 0) {
      toast.error("Vui lòng nhập tên và giá hợp lệ");
      return;
    }

    setSaving(true);
    try {
      let imageFile = form.image_url;

      // Nếu có ảnh mới → upload
      if (newImage) {
        const fd = new FormData();
        fd.append("image", newImage);
        const res = await api.post("/api/products/upload", fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        imageFile = res.data.filename;
      }

      await api.put(
        `/api/products/${id}`,
        {
          name: form.name,
          price: form.price,
          quantity: form.quantity,
          description: form.description,
          image_url: imageFile,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("✅ Cập nhật thành công!");
      navigate("/seller/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật sản phẩm");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <motion.div
      className="max-w-3xl mx-auto p-6 sm:p-10"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate("/seller/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={18} /> Quay lại
        </button>
        <h1 className="text-2xl font-bold text-blue-600">
          ✏️ Chỉnh sửa sản phẩm
        </h1>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 space-y-6"
      >
        {/* Image */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="sm:w-1/3">
            <div className="relative group border rounded-xl overflow-hidden">
              <img
                src={
                  newImage
                    ? URL.createObjectURL(newImage)
                    : form.image_url || "/placeholder.png"
                }
                alt="Product"
                className="w-full h-40 object-cover"
              />
              <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm cursor-pointer transition">
                <UploadCloud className="w-5 h-5 mr-1" /> Đổi ảnh
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setNewImage(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="sm:w-2/3 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Tên sản phẩm
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nhập tên sản phẩm..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Giá (₫)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  className="border rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập giá..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Số lượng
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  className="border rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập số lượng..."
                  min={1}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Mô tả sản phẩm
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="border rounded-lg w-full px-3 py-2 h-32 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Nhập mô tả chi tiết..."
          />
        </div>

        {/* Submit */}
        <div className="text-right">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-md disabled:opacity-60 transition"
          >
            {saving ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
    