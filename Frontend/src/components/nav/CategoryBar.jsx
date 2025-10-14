import { motion } from "framer-motion";
import {
  Smartphone, Laptop, Home, Shirt, Bike, PackageSearch, MoreHorizontal,
} from "lucide-react";

const CATS = [
  { key: "dien-thoai", label: "Điện thoại", icon: Smartphone, color: "text-orange-600" },
  { key: "laptop", label: "Laptop", icon: Laptop, color: "text-amber-600" },
  { key: "xe", label: "Xe cộ", icon: Bike, color: "text-emerald-600" },
  { key: "gia-dung", label: "Gia dụng", icon: Home, color: "text-sky-600" },
  { key: "thoi-trang", label: "Thời trang", icon: Shirt, color: "text-pink-600" },
  { key: "khac", label: "Khác", icon: MoreHorizontal, color: "text-gray-600" },
];

export default function CategoryBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 px-4 py-3 overflow-x-auto"
    >
      <div className="flex items-center gap-3 min-w-max">
        {CATS.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.button
              key={c.key}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 12 }}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl bg-gray-50 hover:bg-orange-50 text-sm font-medium ring-1 ring-gray-100 hover:ring-orange-200"
            >
              <Icon className={`w-5 h-5 ${c.color}`} />
              <span>{c.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
