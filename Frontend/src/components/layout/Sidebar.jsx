// src/components/layout/Sidebar.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Layers, Home, Star, Smartphone, Laptop, Car, Home as HomeIcon, Shirt, Boxes, X } from "lucide-react";

const FIXED_CATEGORIES = [
  { key: "Điện thoại", Icon: Smartphone },
  { key: "Laptop", Icon: Laptop },
  { key: "Xe cộ", Icon: Car },
  { key: "Đồ gia dụng", Icon: HomeIcon },
  { key: "Thời trang", Icon: Shirt },
  { key: "Khác", Icon: Boxes },
];

export default function Sidebar({ selectedCategory, setSelectedCategory }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setOpen((v) => !v);
    window.addEventListener("sidebar:toggle", handler);
    return () => window.removeEventListener("sidebar:toggle", handler);
  }, []);

  // tự đóng khi điều hướng
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);

  // xử lý chọn 1 danh mục: set state, đẩy query, reload
  const chooseCategory = (key) => {
    setSelectedCategory?.(key);
    // đẩy query để Home/ProductGrid lọc theo URL (trigger reload PageWrapper)
    const q = new URLSearchParams(location.search);
    q.set("category", key);
    navigate({ pathname: "/", search: `?${q.toString()}` });
    // ép reload ngay (trong trường hợp bạn không ở trang "/")
    setTimeout(() => window.location.reload(), 50);
  };

  return (
    <>
      {/* overlay (click ngoài để tắt) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[90]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed top-0 left-0 h-full w-72 bg-white z-[100] shadow-2xl border-r"
          >
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-800">Danh mục</h3>
              </div>
              <button
                aria-label="Đóng"
                className="p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-3 space-y-1">
              <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50">
                <Home className="w-4 h-4 text-gray-500" />
                Trang chủ
              </Link>

              <Link
                to="/products?sort=featured"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <Star className="w-4 h-4 text-yellow-500" />
                Sản phẩm nổi bật
              </Link>

              <div className="mt-3 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Chọn danh mục nhanh
              </div>

              {/* Grid 6 danh mục */}
              <div className="grid grid-cols-2 gap-3 px-2 pt-1 pb-3">
                {FIXED_CATEGORIES.map(({ key, Icon }) => {
                  const active = selectedCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => chooseCategory(key)}
                      className={`group flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border transition-all
                        ${active ? "bg-orange-50 border-orange-300" : "bg-white hover:bg-gray-50"}
                        hover:shadow-md`}
                    >
                      <div
                        className={`rounded-2xl p-3 transition-transform group-hover:scale-105 ${
                          active ? "bg-orange-100" : "bg-gray-100"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          active ? "text-orange-600" : "text-gray-700"
                        }`}
                      >
                        {key}
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
