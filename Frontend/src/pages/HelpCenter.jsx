import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  FileText,
  Shield,
  ChevronDown,
  Mail,
} from "lucide-react";

/* -------------------- FAQ DATA -------------------- */
const FAQ_LIST = [
  {
    q: "Làm sao để đăng sản phẩm trên UniTrade?",
    a: "Vào trang cá nhân → chọn 'Đăng sản phẩm' → điền thông tin và tải hình ảnh. Sau khi duyệt, sản phẩm sẽ hiển thị công khai.",
  },
  {
    q: "UniTrade có thu phí người bán không?",
    a: "Hiện tại UniTrade hoàn toàn miễn phí cho người dùng cá nhân. Nếu có thay đổi, chúng tôi sẽ thông báo trước ít nhất 7 ngày.",
  },
  {
    q: "Làm sao để báo cáo sản phẩm vi phạm?",
    a: "Ở trang chi tiết sản phẩm, bấm 'Báo cáo' và nhập lý do. Quản trị viên sẽ xem xét và xử lý trong vòng 24h.",
  },
  {
    q: "Tôi quên mật khẩu thì làm sao?",
    a: "Chọn 'Quên mật khẩu' khi đăng nhập để nhận liên kết đặt lại qua email đã đăng ký.",
  },
];

/* -------------------- PAGE COMPONENT -------------------- */
export default function HelpCenter() {
  const [tab, setTab] = useState("faq");
  const [open, setOpen] = useState(null);

  const renderContent = () => {
    switch (tab) {
      case "faq":
        return (
          <motion.div
            key="faq"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {FAQ_LIST.map((item, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl border border-gray-100 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex justify-between items-center text-left px-5 py-4 font-medium text-gray-800 hover:bg-blue-50 rounded-xl"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-blue-600 transition-transform ${
                      open === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: open === i ? "auto" : 0,
                    opacity: open === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden px-5 pb-3 text-gray-600 text-sm leading-relaxed"
                >
                  {item.a}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        );

      case "terms":
        return (
          <motion.div
            key="terms"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 leading-relaxed text-gray-700 space-y-5"
          >
            <h2 className="text-xl font-semibold text-blue-600">
              📜 Điều khoản dịch vụ
            </h2>
            <p>
              Khi sử dụng UniTrade, bạn đồng ý tuân thủ các quy định sau để đảm
              bảo trải nghiệm an toàn và lành mạnh cho cộng đồng.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Không đăng tải nội dung vi phạm pháp luật hoặc bản quyền.</li>
              <li>Cung cấp thông tin chính xác khi mua bán.</li>
              <li>Không sử dụng nền tảng cho mục đích spam hoặc lừa đảo.</li>
            </ul>
            <p>
              UniTrade có quyền tạm khóa tài khoản nếu phát hiện hành vi vi phạm.
              Các điều khoản có thể được cập nhật và sẽ được thông báo công khai.
            </p>
          </motion.div>
        );

      case "privacy":
        return (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 leading-relaxed text-gray-700 space-y-5"
          >
            <h2 className="text-xl font-semibold text-blue-600">
              🔒 Chính sách bảo mật
            </h2>
            <p>
              UniTrade cam kết bảo vệ thông tin người dùng bằng hệ thống mã hóa
              SSL và xác thực đa lớp.
            </p>
            <p>
              Chúng tôi chỉ thu thập thông tin cần thiết cho việc xác thực và hỗ
              trợ giao dịch. Mọi dữ liệu đều được lưu trữ an toàn và không chia
              sẻ cho bên thứ ba.
            </p>
            <p>
              Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân tại
              trang “Cài đặt tài khoản”.
            </p>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="md:w-1/4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-max"
        >
          <h2 className="text-gray-800 font-semibold mb-4">Trung tâm hỗ trợ</h2>
          <nav className="space-y-2">
            <button
              onClick={() => setTab("faq")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                tab === "faq"
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <HelpCircle className="w-4 h-4" /> Câu hỏi thường gặp
            </button>

            <button
              onClick={() => setTab("terms")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                tab === "terms"
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-4 h-4" /> Điều khoản dịch vụ
            </button>

            <button
              onClick={() => setTab("privacy")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                tab === "privacy"
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Shield className="w-4 h-4" /> Chính sách bảo mật
            </button>
          </nav>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <p className="text-sm text-gray-500">
              Cần thêm trợ giúp? Liên hệ qua email:
            </p>
            <p className="text-sm mt-1 text-blue-600 font-medium flex items-center gap-1">
              <Mail className="w-4 h-4" /> support@unitrade.vn
            </p>
          </div>
        </motion.aside>

        {/* Nội dung */}
        <div className="flex-1 min-h-[60vh]">
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}
