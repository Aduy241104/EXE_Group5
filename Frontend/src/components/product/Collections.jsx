import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, Recycle, Cpu, Shirt, Home, Car, Headphones,
} from "lucide-react";

const CARDS = [
  {
    key: "hoc-tap",
    title: "Học tập & Giáo trình",
    desc: "Sách vở, tài liệu, balo, văn phòng phẩm",
    icon: BookOpen,
    color: "from-blue-500/10 via-blue-100/20 to-blue-200/10",
    accent: "text-blue-600",
  },
  {
    key: "eco-reuse",
    title: "Reuse • Eco",
    desc: "Đồ cũ còn tốt – Tiết kiệm & Xanh",
    icon: Recycle,
    color: "from-emerald-400/10 via-teal-200/20 to-cyan-200/10",
    accent: "text-emerald-600",
  },
  {
    key: "tech",
    title: "Công nghệ & Phụ kiện",
    desc: "Laptop • Tablet • Tai nghe • Phụ kiện",
    icon: Cpu,
    color: "from-sky-400/10 via-indigo-100/20 to-purple-100/10",
    accent: "text-sky-600",
  },
  {
    key: "fashion",
    title: "Thời trang sinh viên",
    desc: "Áo quần, giày dép, phụ kiện giá rẻ",
    icon: Shirt,
    color: "from-pink-400/10 via-rose-100/20 to-orange-100/10",
    accent: "text-pink-600",
  },
  {
    key: "life",
    title: "Đời sống & Gia dụng",
    desc: "Đồ nhà bếp, nội thất, thiết bị tiện ích",
    icon: Home,
    color: "from-lime-400/10 via-green-100/20 to-emerald-100/10",
    accent: "text-green-600",
  },
  {
    key: "travel",
    title: "Xe cộ & Di chuyển",
    desc: "Xe đạp, xe máy, dụng cụ thể thao",
    icon: Car,
    color: "from-yellow-300/10 via-orange-100/20 to-red-100/10",
    accent: "text-orange-600",
  },
];

export default function Collections() {
  return (
    <section className="py-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CARDS.map(({ key, title, desc, icon: Icon, color, accent }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={`/search?collection=${key}`}
              className={`relative block rounded-3xl overflow-hidden bg-gradient-to-br ${color} hover:bg-white transition group ring-1 ring-gray-100 hover:ring-blue-200 shadow-sm hover:shadow-md`}
            >
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="p-6 h-full min-h-[160px] flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 mb-2">
                    Bộ sưu tập
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition">
                    {title}
                  </h4>
                  <p className="text-gray-500 mt-1 text-sm">{desc}</p>
                </div>

                <div className="self-end mt-3">
                  <div
                    className={`bg-white rounded-2xl p-3 ring-1 ring-gray-100 shadow-sm group-hover:ring-blue-200 transition ${accent}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              {/* Hiệu ứng sáng khi hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="absolute w-[160%] h-[160%] bg-white/30 rounded-full blur-3xl -top-1/2 -left-1/3" />
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
