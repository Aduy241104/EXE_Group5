import { Mail, Phone, Home } from "lucide-react";
import { FaFacebookF, FaInstagram, FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="flex-shrink-0 relative z-[5] text-white">
      {/* Nền gradient + overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400" />
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />

      {/* Nội dung chính */}
      <div className="relative max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-12">
        {/* Cột 1: Giới thiệu */}
        <div>
          <h2 className="text-3xl font-extrabold mb-4">UniTrade</h2>
          <p className="text-sm leading-relaxed opacity-90">
            Nền tảng trung gian giúp sinh viên dễ dàng mua bán đồ cũ, giáo trình, thiết bị học tập
            và nhiều hơn nữa. An toàn – Tiện lợi – Tin cậy.
          </p>

          {/* Mạng xã hội */}
          <div className="flex gap-4 mt-5">
            <a
              href="https://facebook.com"
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-orange-600 transition"
            >
              <FaFacebookF size={16} />
            </a>
            <a
              href="https://instagram.com"
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-orange-600 transition"
            >
              <FaInstagram size={16} />
            </a>
            <a
              href="https://github.com"
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-orange-600 transition"
            >
              <FaGithub size={16} />
            </a>
          </div>
        </div>

        {/* Cột 2: Liên kết nhanh */}
        <div className="border-l border-white/30 pl-8">
          <h3 className="font-semibold mb-4 text-lg">Liên kết</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/" className="hover:text-yellow-200 transition font-medium">
                Trang chủ
              </a>
            </li>
            <li>
              <a href="/products" className="hover:text-yellow-200 transition font-medium">
                Tìm kiếm sản phẩm
              </a>
            </li>
            <li>
              <a href="/myposts" className="hover:text-yellow-200 transition font-medium">
                Tin đã đăng
              </a>
            </li>
            <li>
              <a href="/profile" className="hover:text-yellow-200 transition font-medium">
                Hồ sơ cá nhân
              </a>
            </li>
          </ul>
        </div>

        {/* Cột 3: Liên hệ */}
        <div className="border-l border-white/30 pl-8">
          <h3 className="font-semibold mb-4 text-lg">Liên hệ</h3>
          <div className="flex items-center space-x-2 text-sm mb-2">
            <Mail size={16} /> <span>support@unitrade.vn</span>
          </div>
          <div className="flex items-center space-x-2 text-sm mb-2">
            <Phone size={16} /> <span>0123-456-789</span>
          </div>
          <div className="flex items-center space-x-2 text-sm mb-4">
            <Home size={16} /> <span>Hà Nội, Việt Nam</span>
          </div>
          <p className="text-xs opacity-80 italic">
            Hỗ trợ sinh viên 24/7 qua email và fanpage chính thức.
          </p>
        </div>
      </div>

      {/* Thanh dưới cùng */}
      <div className="relative bg-orange-600/90 text-center py-4 text-sm font-medium">
        © {new Date().getFullYear()} <b>UniTrade</b>. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
