import { motion } from "framer-motion";
import { Truck, PiggyBank, Percent, Headphones } from "lucide-react";

const FEATURES = [
  {
    icon: Truck,
    title: "Free Shipping",
    desc: "Miễn phí vận chuyển cho đơn hàng trong khu vực trường học hoặc nội thành.",
  },
  {
    icon: PiggyBank,
    title: "Hoàn tiền dễ dàng",
    desc: "Đổi trả hoặc hoàn tiền trong 3 ngày nếu sản phẩm không đúng mô tả.",
  },
  {
    icon: Percent,
    title: "Ưu đãi sinh viên",
    desc: "Nhận thêm mã giảm giá dành riêng cho sinh viên từ các CLB và shop uy tín.",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    desc: "Đội ngũ UniTrade luôn sẵn sàng hỗ trợ nhanh chóng và tận tâm.",
  },
];

export default function ServiceHighlights() {
  return (
    <section className="bg-blue-50/30 border-y border-blue-100 py-14 mt-10 overflow-hidden">
      {/* Tiêu đề */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-2">
          Vì sao nên chọn <span className="text-blue-600">UniTrade?</span>
        </h2>
        <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto rounded-full"></div>
      </div>

      {/* 4 cột dịch vụ */}
      <motion.div
        className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={{
          hidden: { opacity: 0, y: 40 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, staggerChildren: 0.15 },
          },
        }}
      >
        {FEATURES.map((f, idx) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -5, transition: { duration: 0.25 } }}
              className="flex flex-col items-center justify-center text-gray-700 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow py-8 px-4"
            >
              <Icon className="w-10 h-10 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                {f.desc}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
