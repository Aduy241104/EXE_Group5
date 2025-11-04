import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CategoryPicker from "@/pages/CategoryPicker";
import SpecEditor from "@/components/product/SpecEditor";
import { createPostFD } from "@/services/postApi";
import api from "@/lib/api";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Sparkles,
} from "lucide-react";

const BASE_POST_FEE = 10000;
const OK_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 6;

export default function CreatePost() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    specs: {},
    price: "",
    category: "",
    quantity: 1,
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceRef = useRef(null);
  const checkCtrlRef = useRef(null);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const canNext1 = useMemo(() => {
    const priceOk = Number(form.price) > 0;
    return (
      !!form.title &&
      !!form.category &&
      priceOk &&
      form.description.trim().length > 0
    );
  }, [form]);

  const canSubmit = useMemo(() => {
    const hasImage = images.length > 0;
    return canNext1 && hasImage && !checking && !isSubmitting;
  }, [canNext1, images.length, checking, isSubmitting]);

  const onPickImages = (fileList) => {
    const files = Array.from(fileList || []).slice(0, MAX_IMAGES);
    const valid = [];
    for (const f of files) {
      if (!OK_IMAGE_TYPES.includes(f.type)) {
        alert("Ảnh phải là JPEG/PNG/WebP/AVIF");
        continue;
      }
      if (f.size > MAX_IMAGE_SIZE) {
        alert("Ảnh vượt quá 10MB");
        continue;
      }
      valid.push(f);
    }
    setImages(valid);
  };

  useEffect(() => {
    previews.forEach((u) => URL.revokeObjectURL(u));
    const urls = images.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  const removeImageAt = (idx) =>
    setImages((arr) => arr.filter((_, i) => i !== idx));

  // Kiểm tra voucher
  useEffect(() => {
    if (step !== 2) return;
    if (!voucherCode) {
      setCheckResult(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        if (checkCtrlRef.current) checkCtrlRef.current.abort();
        checkCtrlRef.current = new AbortController();
        setChecking(true);
        const payload = {
          code: voucherCode.trim(),
          context: "post_fee",
          base_fee: BASE_POST_FEE,
          price: Number(form.price) || 0,
          category: form.category,
        };
        const { data } = await api.post("/api/vouchers/check", payload, {
          signal: checkCtrlRef.current.signal,
        });
        setCheckResult(data);
      } catch (e) {
        console.error(e);
        setCheckResult(null);
      } finally {
        setChecking(false);
      }
    }, 400);
  }, [voucherCode, form.price, form.category, step]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("specs", JSON.stringify(form.specs || {}));
      fd.append("price", String(Number(form.price)));
      fd.append("category_id", String(form.category));
      fd.append("voucher_code", voucherCode ? voucherCode.trim() : "");
      fd.append("quantity", String(form.quantity));
      if (images[0])
        fd.append("image", images[0], images[0].name || "image.jpg");

      const created = await createPostFD(fd);
      if (created?.id) window.location.href = `/product/${created.id}`;
      else window.location.href = "/myposts";
    } catch (err) {
      alert(err?.message || "Không thể đăng tin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative flex justify-between items-center mb-10"
      >
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 text-transparent bg-clip-text flex items-center gap-2">
          <Sparkles className="text-sky-400 w-6 h-6 animate-pulse" />
          Đăng tin sản phẩm
        </h1>
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-blue-600">Bước {step}</span>/2
        </div>

        {/* Gradient glow background */}
        <motion.div
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 rounded-full"
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form
            key="step1"
            onSubmit={(e) => {
              e.preventDefault();
              if (canNext1) setStep(2);
            }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg space-y-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Thông tin cơ bản
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Tiêu đề"
                placeholder="VD: iPhone 13 128GB chính hãng"
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
              />
              <Field
                label="Giá bán (VND)"
                type="number"
                min={0}
                placeholder="VD: 5500000"
                value={form.price}
                onChange={(e) => update({ price: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <CategoryPicker
                value={form.category}
                onChange={(id) => update({ category: id })}
              />
              <Field
                label="Số lượng"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  update({ quantity: Number(e.target.value) || 1 })
                }
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                rows={4}
                placeholder="Tình trạng, phụ kiện, bảo hành…"
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Chi tiết sản phẩm */}
            <SpecEditor
              value={form.specs}
              onChange={(specs) => update({ specs })}
              categoryId={form.category}
            />

            <div className="flex justify-end">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                disabled={!canNext1}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold shadow transition ${
                  canNext1
                    ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:brightness-110"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Tiếp tục <ChevronRight size={18} />
              </motion.button>
            </div>
          </motion.form>
        ) : (
          <motion.form
            key="step2"
            onSubmit={submit}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.4 }}
            className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg space-y-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Ảnh & Voucher
            </h3>

            {/* Ảnh */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ảnh sản phẩm ({images.length}/{MAX_IMAGES})
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <AnimatePresence>
                  {previews.map((url, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="relative group rounded-xl overflow-hidden border shadow-sm"
                    >
                      <img
                        src={url}
                        alt="preview"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageAt(idx)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm transition"
                      >
                        Xoá
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {images.length < MAX_IMAGES && (
                  <label className="flex items-center justify-center rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 cursor-pointer transition h-32">
                    <Upload className="text-blue-500 w-6 h-6" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => onPickImages(e.target.files)}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Voucher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã voucher (nếu có)
              </label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Nhập mã giảm phí đăng tin..."
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
              />
              {checking ? (
                <p className="text-sm text-gray-500 mt-1">Đang kiểm tra...</p>
              ) : checkResult ? (
                <p
                  className={`text-sm mt-1 ${
                    checkResult.valid ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {checkResult.message ||
                    (checkResult.valid
                      ? "Voucher hợp lệ!"
                      : "Voucher không hợp lệ.")}
                </p>
              ) : null}
            </div>

            <div className="flex justify-between">
              <motion.button
                type="button"
                onClick={() => setStep(1)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                <ChevronLeft size={18} /> Quay lại
              </motion.button>

              {/* Nút đăng tin */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                disabled={!canSubmit}
                className={`relative overflow-hidden flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold shadow transition ${
                  canSubmit
                    ? "text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {canSubmit && (
                  <motion.div
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 bg-[length:200%_200%] opacity-90"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Đăng tin"
                  )}
                </span>
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Custom Field */
function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 transition"
      />
    </div>
  );
}
