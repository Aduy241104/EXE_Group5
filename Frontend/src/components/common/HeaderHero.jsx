import { motion } from "framer-motion";

export default function HeaderHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-300 text-white py-16">
      {/* Hiệu ứng nền */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ duration: 1 }}
        className="absolute inset-0"
      >
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-yellow-100/20 rounded-full blur-3xl" />
      </motion.div>

      {/* Nội dung hero */}
      <div className="relative container mx-auto px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-extrabold drop-shadow-lg"
        >
          UniTrade
          <span className="block text-yellow-100 mt-2">
            An Toàn – Tiện Lợi – Tin Cậy
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-4 text-lg md:text-xl text-white/90"
        >
          Sàn thương mại điện tử dành cho sinh viên – Mua bán đồ cũ dễ dàng & uy tín
        </motion.p>

        {/* Ô tìm kiếm */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-8 mx-auto max-w-2xl"
        >
          <div className="flex items-center rounded-full bg-white/95 shadow-lg overflow-hidden backdrop-blur ring-1 ring-white/40">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm sản phẩm bạn cần..."
              className="flex-1 px-5 py-3 text-gray-700 bg-transparent outline-none"
            />
            <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 transition">
              Tìm
            </button>
          </div>
          <p className="text-sm text-white/80 mt-3">
            Gợi ý: laptop, giáo trình, xe đạp, quần áo, đồ gia dụng...
          </p>
        </motion.div>
      </div>
    </section>
  );
}
