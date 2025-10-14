import api from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit3,
  Tag,
  TicketPercent,
  Loader2,
  ArrowLeft,
  Save,
  RefreshCcw,
} from "lucide-react";
import { motion } from "framer-motion";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category_id: "",
    status: "active",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [categories, setCategories] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [feePreview, setFeePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState("");

  // === LOAD DATA ===
  useEffect(() => {
    (async () => {
      try {
        const [postRes, catRes] = await Promise.all([
          api.get(`/api/products/${id}`),
          api.get("/api/categories"),
        ]);
        const p = postRes.data;
        setForm({
          name: p.name || "",
          price: p.price || "",
          description: p.description || "",
          category_id: p.category_id || "",
          status: p.status || "active",
        });
        setPreview(p.image_url || p.image || null);
        setCategories(catRes.data?.rows || catRes.data || []);
      } catch (err) {
        console.error("❌ Load lỗi:", err);
        alert("Không tải được bài đăng!");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleFileChange = (file) => {
    setImage(file || null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : preview);
  };

  // === SAVE ===
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("price", String(form.price));
      fd.append("description", form.description);
      fd.append("category_id", String(form.category_id));
      fd.append("status", form.status);
      if (image) fd.append("image", image);

      await api.put(`/api/products/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Đã lưu thay đổi!");
      navigate("/myposts");
    } catch (err) {
      console.error("❌ Lưu thất bại:", err);
      alert(err?.response?.data?.error || "Lỗi khi lưu bài đăng!");
    } finally {
      setSaving(false);
    }
  };

  // === VOUCHER PREVIEW ===
  async function previewFee(vCode = voucherCode) {
    setPreviewLoading(true);
    setPreviewErr("");
    try {
      const { data } = await api.post("/api/vouchers/check", {
        category_id: form.category_id || null,
        voucher_code: (vCode || "").trim() || null,
        context: "post_renew",
      });
      setFeePreview(data || null);
    } catch (e) {
      setFeePreview(null);
      setPreviewErr(e?.response?.data?.error || "Không preview được phí gia hạn");
    } finally {
      setPreviewLoading(false);
    }
  }

  // === RENEW ===
  const handleRenew = async () => {
    if (!window.confirm("Bạn có muốn gia hạn bài đăng này?")) return;
    setRenewing(true);
    try {
      await api.post(`/api/products/${id}/renew`);
      if (voucherCode.trim()) {
        await api.post("/api/vouchers/apply", {
          code: voucherCode.trim(),
          context: "post_renew",
        });
      }
      alert("🔄 Gia hạn thành công!");
      navigate("/myposts");
    } catch (err) {
      console.error("❌ Gia hạn lỗi:", err);
      alert(err?.response?.data?.error || "Gia hạn thất bại!");
    } finally {
      setRenewing(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải bài đăng...
      </div>
    );

  return (
    <motion.div
      className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-soft mt-6"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
        <Edit3 className="w-7 h-7 text-orange-500" /> Chỉnh sửa bài đăng
      </h2>

      <form onSubmit={handleSave} className="space-y-6">
        {/* --- INPUTS --- */}
        <div>
          <label className="block font-medium mb-1 text-gray-700">Tên sản phẩm</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
            placeholder="Nhập tên sản phẩm..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium mb-1 text-gray-700">Giá (VNĐ)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
              placeholder="Nhập giá..."
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-gray-700">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none bg-white"
            >
              <option value="active">Đang hiển thị</option>
              <option value="hidden">Ẩn</option>
              <option value="sold">Đã bán</option>
              <option value="expired">Hết hạn</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700">Mô tả</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none min-h-[100px]"
            placeholder="Mô tả chi tiết sản phẩm..."
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700">Danh mục</label>
          <select
            value={form.category_id}
            onChange={(e) => handleChange("category_id", e.target.value)}
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none bg-white"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700">Ảnh sản phẩm</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            className="w-full border rounded-lg file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-orange-500 file:text-white hover:file:bg-orange-600 transition"
          />
          {preview && (
            <motion.img
              src={preview}
              alt="Preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-3 h-48 object-cover rounded-xl border-2 border-amber-300 shadow-md"
            />
          )}
        </div>

        {/* --- BUTTONS --- */}
        <div className="flex justify-between items-center mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-lg hover:from-orange-600 hover:to-amber-500 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{" "}
            Lưu thay đổi
          </button>
        </div>
      </form>

      {/* === GIA HẠN === */}
      <div className="mt-12 border-t pt-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-700 text-lg">
          <RefreshCcw className="w-5 h-5 text-emerald-600" /> Gia hạn bài đăng
        </h3>

        <div className="p-5 rounded-2xl border bg-gradient-to-br from-emerald-50 to-white shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm mb-1 text-gray-700">Mã voucher (nếu có)</label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Nhập mã voucher..."
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-400 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => previewFee(voucherCode)}
              className="px-5 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
            >
              Xem phí
            </button>
            <button
              type="button"
              disabled={renewing}
              onClick={handleRenew}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 text-white hover:from-orange-600 hover:to-amber-500 transition disabled:opacity-50"
            >
              {renewing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4" />
              )}{" "}
              Gia hạn
            </button>
          </div>

          <div className="mt-4 border rounded-lg bg-white p-4 shadow-inner">
            {previewLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tính phí...
              </div>
            ) : previewErr ? (
              <div className="text-sm text-red-600">{previewErr}</div>
            ) : feePreview ? (
              <div className="text-sm space-y-1">
                {feePreview.source === "FREE_QUOTA" ? (
                  <div className="text-emerald-700 font-medium">
                    ✅ Miễn phí gia hạn trong hạn mức.
                  </div>
                ) : (
                  <>
                    <div>
                      Phí gốc:{" "}
                      <strong>
                        {Number(feePreview.feeBefore || 0).toLocaleString("vi-VN")}đ
                      </strong>
                    </div>
                    <div>
                      Giảm:{" "}
                      <strong>
                        -{Number(feePreview.discount || 0).toLocaleString("vi-VN")}đ
                      </strong>{" "}
                      {feePreview.appliedVoucher
                        ? `(mã ${feePreview.appliedVoucher.code})`
                        : ""}
                    </div>
                    <div className="text-lg">
                      Phí phải trả:{" "}
                      <strong className="text-emerald-700">
                        {Number(feePreview.feeAfter || 0).toLocaleString("vi-VN")}đ
                      </strong>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                Nhập mã voucher và nhấn <b>Xem phí</b> để xem mức phí dự kiến.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
