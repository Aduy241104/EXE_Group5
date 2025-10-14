// src/components/product/SpecEditor.jsx
import { useEffect, useMemo, useState } from "react";

/**
 * SpecEditor – UI nhập thuộc tính sản phẩm
 * - Không thay đổi logic submit cũ của bạn.
 * - value: object hiện tại (nếu có), onChange: trả về object mới
 * - categoryId: để gợi ý bộ thuộc tính theo danh mục
 */
export default function SpecEditor({ value = {}, onChange, categoryId }) {
  const [specs, setSpecs] = useState(value || {});

  // Gợi ý field theo danh mục (tùy biến thêm nếu cần)
  const FIELD_BY_CATEGORY = {
    // ví dụ: id danh mục Điện thoại
    1: [
      { key: "Tình trạng", placeholder: "Mới / Like new / Cũ" },
      { key: "Bộ nhớ", placeholder: "128GB / 256GB ..." },
      { key: "Màu sắc", placeholder: "Đen / Trắng ..." },
      { key: "Bảo hành", placeholder: "Còn 6 tháng..." },
    ],
    // mặc định
    default: [
      { key: "Tình trạng", placeholder: "Mới / Đã dùng..." },
      { key: "Mô tả chi tiết", placeholder: "Thông tin bổ sung..." },
      { key: "Nguồn gốc", placeholder: "Cá nhân / Cửa hàng..." },
    ],
  };

  const fields = useMemo(
    () => FIELD_BY_CATEGORY[categoryId] || FIELD_BY_CATEGORY.default,
    [categoryId]
  );

  useEffect(() => {
    // đồng bộ value từ cha
    setSpecs(value || {});
  }, [value]);

  const update = (k, v) => {
    const next = { ...specs, [k]: v };
    setSpecs(next);
    onChange?.(next);
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm mt-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">🧾 Chi tiết sản phẩm</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map(({ key, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
            <input
              type="text"
              value={specs[key] || ""}
              onChange={(e) => update(key, e.target.value)}
              placeholder={placeholder}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
