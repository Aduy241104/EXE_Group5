import { Mail, Phone, MapPin } from "lucide-react";
import { FaFacebookF, FaInstagram, FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 15 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08 },
  }),
};

export default function Footer() {
  const handleSubscribe = (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Email không hợp lệ!");
      return;
    }
    alert("✅ Cảm ơn bạn đã đăng ký nhận tin!");
    e.target.reset();
  };

  return (
    <footer className="bg-gray-50 text-gray-700 border-t mt-10">
      {/* Nội dung chính */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="max-w-7xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-4"
      >
        {/* Cột 1 */}
        <motion.div variants={fade} custom={0}>
          <h2 className="text-2xl font-bold text-blue-700 mb-3">UniTrade</h2>
          <p className="text-sm leading-relaxed text-gray-600 mb-4">
            Nền tảng thương mại điện tử dành riêng cho sinh viên – nơi kết nối,
            trao đổi đồ cũ, giáo trình và thiết bị học tập dễ dàng, uy tín.
          </p>

          <div className="flex gap-3 mt-4">
            {[FaFacebookF, FaInstagram, FaGithub].map((Icon, i) => (
              <a
                key={i}
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 hover:bg-blue-600 hover:text-white transition"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Cột 2 */}
        <motion.div variants={fade} custom={1}>
          <h3 className="font-semibold mb-3 text-gray-800">Danh mục</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/products" className="hover:text-blue-600">Tất cả sản phẩm</a></li>
            <li><a href="/categories" className="hover:text-blue-600">Danh mục phổ biến</a></li>
            <li><a href="/post/create" className="hover:text-blue-600">Đăng tin miễn phí</a></li>
            <li><a href="/favorites" className="hover:text-blue-600">Tin yêu thích</a></li>
          </ul>
        </motion.div>

        {/* Cột 3 */}
        <motion.div variants={fade} custom={2}>
          <h3 className="font-semibold mb-3 text-gray-800">Hỗ trợ</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/about" className="hover:text-blue-600">Về UniTrade</a></li>
            <li><a href="/faq" className="hover:text-blue-600">Câu hỏi thường gặp</a></li>
            <li><a href="/terms" className="hover:text-blue-600">Điều khoản dịch vụ</a></li>
            <li><a href="/privacy" className="hover:text-blue-600">Chính sách bảo mật</a></li>
          </ul>
        </motion.div>

        {/* Cột 4 */}
        <motion.div variants={fade} custom={3}>
          <h3 className="font-semibold mb-3 text-gray-800">Liên hệ</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2"><Mail size={16}/> unitrade401@gmail.com</li>
            <li className="flex items-center gap-2"><Phone size={16}/> 0123-456-789</li>
            <li className="flex items-center gap-2"><MapPin size={16}/> 600 Nguyễn Văn Cừ Nối Dài, An Bình, Bình Thủy, Cần Thơ 900000</li>
          </ul>

          {/* Newsletter */}
          <form onSubmit={handleSubscribe} className="mt-5">
            <label className="block text-sm mb-1 font-medium">Đăng ký nhận ưu đãi</label>
            <div className="flex">
              <input
                type="email"
                name="email"
                required
                placeholder="Email của bạn"
                className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 text-sm"
              >
                Gửi
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* COPYRIGHT */}
      <div className="border-t bg-white py-4 text-center text-sm text-gray-500">
        <p>
          © {new Date().getFullYear()} <span className="font-semibold text-blue-700">UniTrade</span> —  
          <span className="text-gray-600"> Nền tảng thương mại điện tử dành cho sinh viên Việt Nam.</span>
        </p>
      </div>
    </footer>
  );
}
