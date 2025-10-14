// src/pages/CreatePost.jsx
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Smartphone, Laptop, Car, Home, Shirt, Boxes, TicketPercent, Loader2 } from "lucide-react";
import SpecEditor from "@/components/product/SpecEditor";

export default function CreatePost() {
  const [step, setStep] = useState(1);

  // form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categoryId, setCategoryId] = useState("");

  // ✅ NEW: attributes (chi tiết sản phẩm)
  const [attributes, setAttributes] = useState({});

  // data
  const [categories, setCategories] = useState([]);

  // voucher UI
  const [myVouchers, setMyVouchers] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [feePreview, setFeePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/api/categories");
        if (!mounted) return;
        const list = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res.data?.rows) ? res.data.rows : []);
        setCategories(list);
      } catch (err) {
        console.error("❌ Lỗi khi load categories:", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // lấy voucher khả dụng cho seller (dropdown gợi ý)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/api/my/vouchers");
        if (!mounted) return;
        const items = res?.data?.items || [];
        setMyVouchers(items);
      } catch {
        setMyVouchers([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleImageChange = (file) => {
    setImage(file || null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  };
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  // ===== Preview fee =====
  async function runPreview(vCode = voucherCode) {
    if (!categoryId) {
      setFeePreview(null);
      return;
    }
    try {
      setPreviewLoading(true);
      setPreviewErr("");
      const { data } = await api.post("/api/my/vouchers/preview", {
        category_id: categoryId || null,
        voucher_code: (vCode || "").trim() || null,
      });
      setFeePreview(data || null);
    } catch (e) {
      setFeePreview(null);
      setPreviewErr(e?.response?.data?.error || "Không preview được phí");
    } finally {
      setPreviewLoading(false);
    }
  }

  useEffect(() => {
    if (step === 3) runPreview("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, categoryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !description || !image || !categoryId) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin");
      return;
    }
    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      alert("⚠️ Giá phải là số > 0");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("price", String(priceNumber));
    formData.append("description", description.trim());
    formData.append("image", image);
    formData.append("category_id", String(categoryId));
    if (voucherCode?.trim()) formData.append("voucher_code", voucherCode.trim());

    // ✅ NEW: append attributes
    if (attributes && Object.keys(attributes).length) {
      formData.append("attributes", JSON.stringify(attributes));
    }

    try {
      await api.post("/api/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("🎉 Đăng tin thành công!");
      setStep(1);
      setName(""); setPrice(""); setDescription("");
      setImage(null); if (preview) URL.revokeObjectURL(preview); setPreview(null);
      setCategoryId("");
      setVoucherCode("");
      setFeePreview(null);
      setAttributes({});
    } catch (err) {
      console.error("❌ Lỗi khi đăng sản phẩm:", err);
      alert(err?.response?.data?.error || "Đăng tin thất bại!");
    }
  };

  const categoryIcons = {
    "Điện thoại": <Smartphone className="w-6 h-6" />,
    Laptop: <Laptop className="w-6 h-6" />,
    "Xe cộ": <Car className="w-6 h-6" />,
    "Đồ gia dụng": <Home className="w-6 h-6" />,
    "Thời trang": <Shirt className="w-6 h-6" />,
    Khác: <Boxes className="w-6 h-6" />,
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-soft mt-6"
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
        <Tag className="w-6 h-6 text-orange-500" /> Đăng tin sản phẩm
      </h2>

      <div className="flex justify-between mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s}
            className={`flex-1 h-2 mx-1 rounded-full transition ${step >= s ? "bg-orange-500" : "bg-gray-200"}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {/* ===== BƯỚC 1 ===== */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.25 }} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Tên sản phẩm</label>
                <input type="text" placeholder="Nhập tên sản phẩm..." value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none" />
              </div>

              <div>
                <label className="block font-medium mb-1">Giá (VNĐ)</label>
                <input type="number" placeholder="Nhập giá sản phẩm..." value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none" />
              </div>

              <div>
                <label className="block font-medium mb-1">Mô tả</label>
                <textarea placeholder="Mô tả chi tiết sản phẩm..." value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none min-h-[100px]" />
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setStep(2)}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition">
                  Tiếp tục →
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== BƯỚC 2 ===== */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.25 }} className="space-y-5">
              <div>
                <label className="block font-medium mb-2">Chọn loại sản phẩm</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((c) => (
                    <button type="button" key={c.id} onClick={() => setCategoryId(c.id)}
                      className={`flex flex-col items-center gap-2 border rounded-xl p-4 hover:border-orange-400 transition ${
                        String(categoryId) === String(c.id) ? "border-2 border-orange-500 bg-orange-50" : ""}`}>
                      {categoryIcons[c.name] || <Boxes className="w-6 h-6 text-gray-500" />}
                      <span className="text-sm font-medium">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Ảnh sản phẩm</label>
                <input type="file" accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0])} className="w-full" />
                {preview && <img src={preview} alt="Preview" className="mt-3 h-40 object-cover rounded-lg border" />}
              </div>

              {/* ✅ NEW: SpecEditor – chi tiết sản phẩm */}
              <SpecEditor
                categoryId={categoryId}
                value={attributes}
                onChange={setAttributes}
              />

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)}
                  className="px-6 py-2 rounded-lg border hover:bg-gray-50 transition">← Quay lại</button>
                <button type="button" onClick={() => setStep(3)}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition">
                  Tiếp tục →
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== BƯỚC 3 (xem lại + phí/voucher) ===== */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.25 }} className="space-y-5">
              {/* ... GIỮ NGUYÊN NỘI DUNG BƯỚC 3 CỦA BẠN (voucher/preview/submit) ... */}

              {/* nút submit */}
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(2)}
                  className="px-6 py-2 rounded-lg border hover:bg-gray-50 transition">← Quay lại</button>
                <button type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition">
                   Đăng tin
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
