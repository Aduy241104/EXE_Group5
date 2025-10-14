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
    bg: "from-amber-300 via-orange-400 to-red-400",
  },
  {
    key: "eco-reuse",
    title: "Reuse • Eco",
    desc: "Đồ cũ còn tốt – Tiết kiệm & Xanh",
    icon: Recycle,
    bg: "from-emerald-400 via-teal-400 to-cyan-400",
  },
  {
    key: "tech",
    title: "Công nghệ & Phụ kiện",
    desc: "Laptop • Tablet • Tai nghe • Phụ kiện",
    icon: Cpu,
    bg: "from-sky-400 via-indigo-400 to-purple-500",
  },
  {
    key: "fashion",
    title: "Thời trang sinh viên",
    desc: "Áo quần, giày dép, phụ kiện giá rẻ",
    icon: Shirt,
    bg: "from-pink-400 via-rose-400 to-orange-400",
  },
  {
    key: "life",
    title: "Đời sống & Gia dụng",
    desc: "Đồ nhà bếp, nội thất, thiết bị tiện ích",
    icon: Home,
    bg: "from-lime-400 via-green-400 to-emerald-400",
  },
  {
    key: "travel",
    title: "Xe cộ & Di chuyển",
    desc: "Xe đạp, xe máy, dụng cụ thể thao",
    icon: Car,
    bg: "from-yellow-300 via-orange-400 to-red-400",
  },
];

export default function Collections() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CARDS.map(({ key, title, desc, icon: Icon, bg }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
        >
          <Link
            to={`/search?collection=${key}`}
            className={`relative block rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${bg}`} />
            <div className="relative p-6 h-full min-h-[160px] bg-black/20 backdrop-blur-sm text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-white/20 ring-1 ring-white/30">
                    Bộ sưu tập
                  </div>
                  <h4 className="mt-3 text-lg font-extrabold drop-shadow">{title}</h4>
                  <p className="text-white/95 mt-1 text-sm">{desc}</p>
                </div>
                <div className="shrink-0 mt-2">
                  <div className="bg-white/20 rounded-2xl p-3 ring-1 ring-white/30 group-hover:bg-white/30 transition">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition"
              whileHover={{ scale: 1.05 }}
            >
              <div className="absolute w-[140%] h-[140%] bg-white rounded-full blur-3xl -top-1/2 -left-1/3" />
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
