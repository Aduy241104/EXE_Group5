import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Layers, Home, Star,
  Smartphone, Laptop, Bike, Home as HomeIcon, Shirt, Book,
  Headphones, Camera, Boxes, X, Music2,
} from "lucide-react";
import { useCategoryFilter } from "@/context/CategoryFilterContext";

/** Sidebar dùng chung SLUG với CategoryBar để filter đồng nhất */
const CATS = [
  { key: "dien-thoai", label: "Điện thoại",  icon: Smartphone, color: "text-sky-600" },
  { key: "laptop",     label: "Laptop",      icon: Laptop,     color: "text-blue-600" },
  { key: "may-anh",    label: "Máy ảnh",     icon: Camera,     color: "text-indigo-600" },
  { key: "tai-nghe",   label: "Tai nghe",    icon: Headphones, color: "text-cyan-600" },
  { key: "phu-kien",   label: "Phụ kiện",    icon: Boxes,      color: "text-teal-600" },
  { key: "sach",       label: "Sách/Giáo trình", icon: Book,   color: "text-emerald-600" },
  { key: "hoc-tap",    label: "Đồ học tập",  icon: Book,       color: "text-green-600" },
  { key: "phong-tro",  label: "Đồ phòng trọ",icon: HomeIcon,   color: "text-blue-500" },
  { key: "gia-dung",   label: "Gia dụng",    icon: HomeIcon,   color: "text-cyan-600" },
  { key: "thoi-trang", label: "Thời trang",  icon: Shirt,      color: "text-pink-500" },
  { key: "xe",         label: "Xe cộ",       icon: Bike,       color: "text-indigo-500" },
  { key: "nhac-cu",    label: "Nhạc cụ",     icon: Music2,     color: "text-indigo-600" },
  { key: "khac",       label: "Khác",        icon: Boxes,      color: "text-gray-600" },
];

export default function Sidebar({ allowedKeys }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { value, setCategory } = useCategoryFilter();

  useEffect(() => {
    const handler = () => setOpen((v) => !v);
    window.addEventListener("sidebar:toggle", handler);
    return () => window.removeEventListener("sidebar:toggle", handler);
  }, []);

  // tự đóng khi điều hướng
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);

  const cats = Array.isArray(allowedKeys) && allowedKeys.length
    ? CATS.filter((c) => allowedKeys.includes(c.key))
    : CATS;

  const isActive = (key) => (Array.isArray(value) ? value.includes(key) : value === key);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[90] backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="fixed top-0 left-0 h-full w-72 bg-white z-[100] shadow-2xl border-r rounded-tr-3xl rounded-br-3xl"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-tr-3xl">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                <h3 className="font-semibold">Danh mục</h3>
              </div>
              <button aria-label="Đóng" className="p-2 rounded-lg hover:bg-white/10" onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-800 transition"
              >
                <Home className="w-4 h-4 text-blue-500" />
                Trang chủ
              </Link>

              <Link
                to="/products?sort=featured"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-800 transition"
              >
                <Star className="w-4 h-4 text-yellow-500" />
                Sản phẩm nổi bật
              </Link>

              <div className="mt-3 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Danh mục phổ biến
              </div>

              {/* Category grid */}
              <div className="grid grid-cols-2 gap-3 px-2 pb-6">
                {cats.map(({ key, label, icon: Icon, color }) => {
                  const active = isActive(key);
                  return (
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.93 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      onClick={() => setCategory(active ? null : key)}
                      className={`group relative flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border text-sm font-medium transition-all
                        ${active ? "bg-blue-50 border-blue-300" : "bg-white hover:bg-gray-50"}
                        hover:shadow-md focus:outline-none`}
                    >
                      <div className={`rounded-2xl p-3 transition-transform group-hover:scale-105 ${active ? "bg-blue-100" : "bg-gray-100"}`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                      <div className={`${active ? "text-blue-600" : "text-gray-700"} text-sm`}>
                        {label}
                      </div>
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute bottom-2 w-10 h-1 bg-blue-500 rounded-full"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </motion.button>
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
