import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import GoogleBtn from "../components/google/GoogleBtn"; // ✅ giữ nguyên Google login

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const success = await login(email, password);
    if (success) navigate("/");
    else setError("❌ Sai email hoặc mật khẩu!");
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-100 to-indigo-50">
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-[90%] max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 sm:p-10 border border-gray-100">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-sky-400 animate-pulse" />
              Đăng nhập UniTrade
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Chào mừng bạn quay lại 👋
            </p>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm mb-4 text-center font-medium"
            >
              {error}
            </motion.p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field
              label="Email"
              icon={<Mail className="text-gray-400" size={18} />}
            >
              <input
                type="email"
                className="flex-1 bg-transparent outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
                required
              />
            </Field>

            <Field
              label="Mật khẩu"
              icon={<Lock className="text-gray-400" size={18} />}
            >
              <input
                type="password"
                className="flex-1 bg-transparent outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
              />
            </Field>

            {/* Nút đăng nhập */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              className="relative w-full overflow-hidden rounded-xl py-2.5 font-semibold text-white shadow-md"
            >
              {/* Gradient xanh chuyển động */}
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500 bg-[length:200%_200%] opacity-90"
              />
              <span className="relative z-10 flex justify-center items-center gap-2">
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Đăng nhập"
                )}
              </span>
            </motion.button>
          </form>

          {/* Google login giữ nguyên */}
          <div className="mt-5">
            <GoogleBtn />
          </div>

          {/* Link đăng ký */}
          <p className="text-center text-sm mt-6 text-gray-600">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="text-blue-600 font-semibold hover:underline hover:text-sky-500 transition"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* Field wrapper */
function Field({ label, icon, children }) {
  return (
    <div>
      <label className="block font-medium mb-1 text-gray-700">{label}</label>
      <div className="flex items-center gap-2 border rounded-xl px-3 py-2 shadow-sm bg-white border-gray-200 focus-within:ring-2 focus-within:ring-blue-400 transition-all">
        {icon}
        {children}
      </div>
    </div>
  );
}
