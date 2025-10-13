import api from '../lib/api';
import { useEffect, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Tag, Smartphone, Laptop, Car, Home, Shirt, Boxes } from "lucide-react";

export default function CreatePost() {
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);

  // ✅ Load categories từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("http://localhost:5000/api/categories/all");
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else if (res.data.rows) {
          setCategories(res.data.rows);
        }
      } catch (err) {
        console.error("❌ Lỗi khi load categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleImageChange = (file) => {
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !description || !image || !categoryId) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("image", image);
    formData.append("category_id", categoryId);

    try {
      const token = localStorage.getItem("token");
      await api.post("http://localhost:5000/api/products", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("🎉 Đăng tin thành công!");
      setStep(1);
      setName("");
      setPrice("");
      setDescription("");
      setImage(null);
      setPreview(null);
      setCategoryId("");
    } catch (err) {
      console.error("❌ Lỗi khi đăng sản phẩm:", err);
      alert("Đăng tin thất bại!");
    }
  };

  // Map icon demo cho category (nếu DB chưa có icon)
  const categoryIcons = {
    "Điện thoại": <Smartphone className="w-6 h-6" />,
    "Laptop": <Laptop className="w-6 h-6" />,
    "Xe cộ": <Car className="w-6 h-6" />,
    "Đồ gia dụng": <Home className="w-6 h-6" />,
    "Thời trang": <Shirt className="w-6 h-6" />,
    "Khác": <Boxes className="w-6 h-6" />,
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-soft mt-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Tag className="w-6 h-6 text-orange-500" /> Đăng tin sản phẩm
      </h2>

      {/* Stepper indicator */}
      <div className="flex justify-between mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 mx-1 rounded-full transition ${
              step >= s ? "bg-orange-500" : "bg-gray-200"
            }`}
          ></div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {/* Step 1: Thông tin cơ bản */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <label className="block font-medium mb-1">Tên sản phẩm</label>
                <input
                  type="text"
                  placeholder="Nhập tên sản phẩm..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Giá (VNĐ)</label>
                <input
                  type="number"
                  placeholder="Nhập giá sản phẩm..."
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Mô tả</label>
                <textarea
                  placeholder="Mô tả chi tiết sản phẩm..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none min-h-[100px]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
                >
                  Tiếp tục →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Category + Ảnh */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div>
                <label className="block font-medium mb-2">Chọn loại sản phẩm</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCategoryId(c.id)}
                      className={`flex flex-col items-center gap-2 border rounded-xl p-4 hover:border-orange-400 transition ${
                        categoryId == c.id
                          ? "border-2 border-orange-500 bg-orange-50"
                          : ""
                      }`}
                    >
                      {categoryIcons[c.name] || (
                        <Boxes className="w-6 h-6 text-gray-500" />
                      )}
                      <span className="text-sm font-medium">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Ảnh sản phẩm</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files[0])}
                  className="w-full"
                />
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="mt-3 h-40 object-cover rounded-lg border"
                  />
                )}
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2 rounded-lg border hover:bg-gray-50 transition"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
                >
                  Tiếp tục →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Xác nhận */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <h3 className="font-bold text-lg mb-2">Xem lại thông tin</h3>
              <div className="p-4 border rounded-lg space-y-2 bg-gray-50">
                <p>
                  <strong>Tên:</strong> {name}
                </p>
                <p>
                  <strong>Giá:</strong> {price} VNĐ
                </p>
                <p>
                  <strong>Mô tả:</strong> {description}
                </p>
                <p>
                  <strong>Danh mục:</strong>{" "}
                  {categories.find((c) => c.id == categoryId)?.name || "Chưa chọn"}
                </p>
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="mt-2 h-40 object-cover rounded-lg border"
                  />
                )}
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2 rounded-lg border hover:bg-gray-50 transition"
                >
                  ← Quay lại
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  ✅ Đăng tin
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
