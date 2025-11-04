import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send, Loader2 } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { Link } from "react-router-dom";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setToast({ type: "error", message: "Vui lòng điền đầy đủ thông tin." });
      return;
    }

    try {
      setSending(true);
      // Gửi API hoặc giả lập gửi mail
      await new Promise((r) => setTimeout(r, 1500));
      setToast({ type: "success", message: "🎉 Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất." });
      setForm({ name: "", email: "", message: "" });
    } catch {
      setToast({ type: "error", message: "Không thể gửi, vui lòng thử lại sau." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 py-16 relative overflow-hidden">
      {/* Background decor */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -z-10 -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-sky-100/40 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold text-center text-gray-800 mb-10"
        >
          Liên hệ với{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
            UniTrade
          </span>
        </motion.h1>

        <div className="grid md:grid-cols-2 gap-10">
          {/* LEFT: Thông tin liên hệ */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 shadow-xl ring-1 ring-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-5">
              Thông tin liên hệ
            </h2>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-center gap-3">
                <Phone className="text-blue-600 w-5 h-5" />
                <span>
                  Hotline:{" "}
                  <b className="text-gray-800 hover:text-blue-600 transition">
                    0834 045 971
                  </b>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-blue-600 w-5 h-5" />
                <span>
                  Email:{" "}
                  <b className="text-gray-800 hover:text-blue-600 transition">
                    unitrade401@gmail.com
                  </b>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="text-blue-600 w-5 h-5 mt-[2px]" />
                <span>
                  Trụ sở:{" "}
                  <b className="text-gray-800">
                    600 Nguyễn Văn Cừ Nối Dài, An Bình, Bình Thủy, Cần Thơ
                    900000
                  </b>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="text-blue-600 w-5 h-5" />
                <span>
                  Giờ làm việc:{" "}
                  <b className="text-gray-800">
                    Thứ 2 – Thứ 6 (8:00 - 17:30)
                  </b>
                </span>
              </li>
            </ul>

            {/* Map Embed */}
            <div className="mt-6 rounded-xl overflow-hidden shadow-md ring-1 ring-gray-100">
              <iframe
                title="UniTrade Office Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3924.641632703065!2d105.73434877478756!3d10.045930490049273!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a089feca0f4a29%3A0x70e9e8fdfc0dbccc!2zNjAwIE5ndXnhu4VuIFbEg24gQ-G7qCBu4buNaSBEw6BpLCBBbiBCw6xuaCwgQsOsbmggVGjhu6ksIEPhuqd1IFRow6ogOTAwMDAwLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1730754211025!5m2!1svi!2s"
                width="100%"
                height="230"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </motion.div>

          {/* RIGHT: Form liên hệ */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 shadow-xl ring-1 ring-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-5">
              Gửi tin nhắn cho chúng tôi
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Họ và tên"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <input
                type="email"
                placeholder="Email của bạn"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <textarea
                placeholder="Nội dung tin nhắn"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                className="w-full rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400 resize-none"
              ></textarea>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={sending}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:opacity-90 text-white font-semibold px-4 py-3 rounded-lg shadow-lg transition disabled:opacity-60"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Gửi ngay
                </>
              )}
            </motion.button>
          </motion.form>
        </div>

        {/* FAQ Mini */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-14 bg-gradient-to-r from-sky-50 to-blue-50 border border-blue-100 rounded-2xl p-6 text-center text-gray-700 shadow-sm"
        >
          <h3 className="font-semibold text-gray-800 mb-2">
            ❓ Câu hỏi thường gặp
          </h3>
          <p className="text-sm">
            Bạn có thể xem thêm tại mục{" "}
            <Link
              to="/help"
              className="text-blue-600 hover:underline font-medium"
            >
              Trung tâm hỗ trợ
            </Link>{" "}
            để được giải đáp nhanh hơn.
          </p>
        </motion.div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
    