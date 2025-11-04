import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Users, Target, Leaf, HeartHandshake, TrendingUp, GraduationCap, Rocket, Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -150]);

  return (
    <div ref={ref} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 overflow-hidden">
      {/* ================= Hero Section ================= */}
      <section className="relative h-[70vh] flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Gradient động */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-sky-100 via-blue-50 to-indigo-100"
          style={{ y }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_60%)]"
        />
        {/* Hero Text */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-extrabold text-gray-800 relative z-10"
        >
          Về <span className="text-blue-600">UniTrade</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-gray-600 mt-4 max-w-2xl mx-auto relative z-10 text-lg"
        >
          Nơi sinh viên kết nối – chia sẻ – và xây dựng cộng đồng học tập bền vững.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="absolute bottom-0 w-full h-60 bg-gradient-to-t from-blue-100/60 to-transparent blur-2xl"
        />
      </section>

      {/* ================= Sứ mệnh & Tầm nhìn ================= */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white rounded-2xl p-8 shadow-md ring-1 ring-gray-100"
        >
          <Target className="w-10 h-10 text-blue-600 mb-3" />
          <h2 className="text-xl font-semibold text-gray-800 mb-3">🎯 Sứ mệnh</h2>
          <p className="text-gray-600 leading-relaxed">
            UniTrade ra đời với mong muốn mang lại môi trường trao đổi, mua bán học liệu và vật dụng học tập
            một cách **minh bạch, tiện lợi, và thân thiện với môi trường**.
            Chúng tôi tin rằng sinh viên không chỉ học tập — mà còn là những người tạo nên thay đổi tích cực.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white rounded-2xl p-8 shadow-md ring-1 ring-gray-100"
        >
          <Leaf className="w-10 h-10 text-green-600 mb-3" />
          <h2 className="text-xl font-semibold text-gray-800 mb-3">🌱 Tầm nhìn</h2>
          <p className="text-gray-600 leading-relaxed">
            Trở thành nền tảng thương mại điện tử hàng đầu cho sinh viên Việt Nam —
            **thúc đẩy văn hóa chia sẻ và tiêu dùng bền vững**, hướng đến cộng đồng sinh viên xanh, sáng tạo, và trách nhiệm.
          </p>
        </motion.div>
      </section>

      {/* ================= Giá trị cốt lõi ================= */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-gradient-to-r from-blue-100/60 via-white to-sky-100/60 rounded-2xl shadow-md ring-1 ring-blue-100 p-10"
        >
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            💡 Giá trị cốt lõi của UniTrade
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <HeartHandshake className="w-10 h-10 text-pink-500" />,
                title: "Cộng đồng & Tin cậy",
                desc: "Mọi giao dịch đều dựa trên sự minh bạch, an toàn và niềm tin giữa sinh viên với sinh viên.",
              },
              {
                icon: <Users className="w-10 h-10 text-blue-500" />,
                title: "Kết nối & Chia sẻ",
                desc: "Mở rộng mạng lưới sinh viên toàn quốc, tạo cầu nối học hỏi và tương trợ lẫn nhau.",
              },
              {
                icon: <Leaf className="w-10 h-10 text-green-500" />,
                title: "Xanh & Bền vững",
                desc: "Khuyến khích tái sử dụng — hướng đến môi trường học tập xanh và tiêu dùng có trách nhiệm.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, rotate: 0.5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white rounded-2xl p-6 text-center shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex justify-center mb-3">{item.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ================= Hành trình phát triển ================= */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-bold text-center text-gray-800 mb-10"
          >
            🚀 Hành trình phát triển của UniTrade
          </motion.h2>

          <div className="relative border-l-2 border-blue-200 pl-6 space-y-10">
            {[
              {
                year: "202x",
                title: "Khởi nguồn ý tưởng",
                desc: "Nhóm sinh viên tại Cần Thơ nhận ra nhu cầu trao đổi đồ dùng học tập ngày càng lớn.",
                icon: <GraduationCap className="text-blue-500 w-6 h-6" />,
              },
              {
                year: "202x",
                title: "Phát triển nền tảng",
                desc: "Phiên bản beta đầu tiên của UniTrade được ra mắt — hỗ trợ sinh viên các trường đại học lớn.",
                icon: <Rocket className="text-orange-500 w-6 h-6" />,
              },
              {
                year: "202x",
                title: "Mở rộng toàn quốc",
                desc: "UniTrade đạt mốc 100.000 người dùng — trở thành cộng đồng sinh viên thương mại điện tử đầu tiên tại Việt Nam.",
                icon: <TrendingUp className="text-green-500 w-6 h-6" />,
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="relative pl-10"
              >
                <div className="absolute -left-4 top-1.5 w-8 h-8 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center shadow-sm">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {step.year} — {step.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA cuối ================= */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center py-20 bg-gradient-to-b from-blue-50 to-sky-100"
      >
        <Sparkles className="w-10 h-10 text-blue-500 mx-auto mb-3" />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Cùng UniTrade xây dựng tương lai xanh hơn 🌍
        </h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Chúng tôi luôn chào đón mọi sinh viên — những người trẻ đam mê chia sẻ, học hỏi,  
          và mong muốn tạo nên tác động tích cực cho cộng đồng.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-md transition"
        >
          Liên hệ với UniTrade →
        </Link>
      </motion.section>
    </div>
  );
}
