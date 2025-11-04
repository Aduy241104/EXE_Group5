import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Info } from "lucide-react";

/**
 * ✨ SpecEditor – Trình chỉnh sửa "Chi tiết sản phẩm" linh hoạt
 * - Cho phép seller thêm / xoá / chỉnh sửa các thông tin tuỳ ý
 * - Hỗ trợ gợi ý theo danh mục (categoryId)
 * - Giao diện hiện đại, đồng bộ tone eStore (xanh lam chủ đạo)
 */
export default function SpecEditor({ value = {}, onChange, categoryId }) {
  const [fields, setFields] = useState(
    Object.entries(value || {}).map(([key, val]) => ({ key, val }))
  );

  // Gợi ý mặc định theo danh mục
  useEffect(() => {
    if (!categoryId) return;
    const presets = getPresets(categoryId);
    if (presets.length > 0 && fields.length === 0) {
      setFields(presets.map((k) => ({ key: k, val: "" })));
    }
  }, [categoryId]);

  // Cập nhật ra ngoài
  useEffect(() => {
    const specs = {};
    for (const f of fields) {
      if (f.key.trim()) specs[f.key.trim()] = f.val.trim();
    }
    onChange?.(specs);
  }, [fields]);

  // Hành động
  const updateField = (i, patch) =>
    setFields((arr) =>
      arr.map((f, idx) => (i === idx ? { ...f, ...patch } : f))
    );
  const addField = () => setFields((arr) => [...arr, { key: "", val: "" }]);
  const removeField = (i) =>
    setFields((arr) => arr.filter((_, idx) => idx !== i));

  return (
    <motion.div
      layout
      className="rounded-3xl border border-gray-100 bg-gradient-to-b from-white to-blue-50/30 p-5 shadow-sm hover:shadow-md transition"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-800 text-lg">
            Chi tiết sản phẩm
          </h2>
          <Info className="w-4 h-4 text-blue-500" />
        </div>
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700 active:scale-[0.97] transition"
        >
          <Plus size={14} /> Thêm dòng
        </button>
      </div>

      {/* Nội dung */}
      <AnimatePresence>
        {fields.length === 0 ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-gray-500 italic mb-2"
          >
            Chưa có thông tin nào. Hãy thêm các dòng như “Tình trạng”, “Năm mua”, “Phụ kiện kèm”, v.v...
          </motion.p>
        ) : (
          <motion.div layout className="space-y-2" transition={{ staggerChildren: 0.05 }}>
            {fields.map((f, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-5 gap-2 items-center group"
              >
                <input
                  value={f.key}
                  onChange={(e) => updateField(i, { key: e.target.value })}
                  placeholder="Tên thông tin (VD: Hãng, Năm mua...)"
                  className="col-span-2 rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
                <input
                  value={f.val}
                  onChange={(e) => updateField(i, { val: e.target.value })}
                  placeholder="Giá trị (VD: 2023, Còn mới 90%)"
                  className="col-span-2 rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
                <button
                  type="button"
                  onClick={() => removeField(i)}
                  className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-600 flex items-center justify-center"
                  title="Xoá dòng"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ===== Helper để sinh gợi ý theo danh mục ===== */
function getPresets(categoryId) {
  const presets = {
    laptop: ["Hãng", "CPU", "RAM", "Ổ cứng", "Tình trạng"],
    phone: ["Hãng", "Dung lượng", "Tình trạng", "Phụ kiện kèm"],
    book: ["Tác giả", "Thể loại", "Tình trạng"],
    furniture: ["Chất liệu", "Kích thước", "Tình trạng"],
    bike: ["Loại xe", "Năm mua", "Tình trạng"],
    fashion: ["Kích cỡ", "Màu sắc", "Tình trạng"],
  };
  return presets[categoryId] || [];
}
