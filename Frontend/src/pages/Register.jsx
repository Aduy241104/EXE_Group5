import api from "@/lib/api";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { User, Phone, Mail, Lock, Loader2 } from "lucide-react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      setError("❌ Mật khẩu nhập lại không khớp!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("http://localhost:5000/api/auth/register", {
        username,
        phone,
        email,
        password,
      });

      alert(res.data.message || "✅ Đăng ký thành công, vui lòng đăng nhập!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "❌ Đăng ký thất bại, thử lại!");
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-orange-100 via-pink-100 to-blue-100">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-[380px] animate-fadeIn">
        <h2 className="text-3xl font-bold mb-6 text-center text-orange-600">
          Đăng ký
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center font-medium">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Tên người dùng</label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-orange-500">
              <User className="text-gray-400 mr-2" size={18} />
              <input
                type="text"
                className="w-full outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên người dùng"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Số điện thoại</label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-orange-500">
              <Phone className="text-gray-400 mr-2" size={18} />
              <input
                type="text"
                className="w-full outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Email</label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-orange-500">
              <Mail className="text-gray-400 mr-2" size={18} />
              <input
                type="email"
                className="w-full outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Mật khẩu</label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-orange-500">
              <Lock className="text-gray-400 mr-2" size={18} />
              <input
                type="password"
                className="w-full outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Nhập lại mật khẩu</label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-orange-500">
              <Lock className="text-gray-400 mr-2" size={18} />
              <input
                type="password"
                className="w-full outline-none"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition shadow-md flex justify-center items-center"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Đăng ký"
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="text-orange-600 font-semibold hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
