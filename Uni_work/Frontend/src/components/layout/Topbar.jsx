import api from '../../lib/api';
// src/components/layout/Topbar.jsx
import { useContext, useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  Heart,
  MessageCircle,
  PlusCircle,
  User,
  ListChecks,
  BarChart3,
  LogOut,
  Shield,
  CheckCircle2,
  Menu,
  Bell,
  Trash2,
  CheckCheck,
} from "lucide-react";

import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Khởi tạo socket 1 lần
const socket = io(API, { transports: ["websocket"], autoConnect: true });

export default function Topbar() {
  const { user, logout, token } = useContext(AuthContext);

  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // search
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // notifications
  const [nbOpen, setNbOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [nbUnread, setNbUnread] = useState(0);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const dropdownRef = useRef(null);
  const nbRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  /* ===================== UI helpers ===================== */
  const onToggleSidebar = () => {
    window.dispatchEvent(new CustomEvent("sidebar:toggle"));
    document.body.classList.toggle("sidebar-open");
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Đóng dropdown user khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đóng dropdown thông báo khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (nbRef.current && !nbRef.current.contains(e.target)) {
        setNbOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đồng bộ khi quay lại tab (token vẫn valid)
  useEffect(() => {
    const onFocus = async () => {
      if (!token) return;
      try {
        await api.get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [token]);

  /* ===================== SEARCH ===================== */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`${API}/api/products/search`, {
          params: { q: searchTerm },
        });
        setSuggestions((res.data || []).slice(0, 6));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    setSuggestions([]);
  };

  /* ===================== NOTIFICATIONS ===================== */
  const loadNotifs = useCallback(async () => {
    if (!token || !user) return;
    try {
      const res = await api.get(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs(res.data.items || []);
      setNbUnread(res.data.unread || 0);
    } catch {
      // 403 khi chưa phải admin chỉ ảnh hưởng đến POST; GET vẫn cho user thường
    }
  }, [token, user]);

  // Chỉ load khi đã có token & user
  useEffect(() => {
    if (!token || !user) return;
    loadNotifs();
  }, [token, user, loadNotifs]);

  // Realtime: lắng nghe kênh riêng của user
  useEffect(() => {
    if (!user?.id) return;
    const channel = `notification:new:${user.id}`;
    const handler = (payload) => {
      setNotifs((prev) => [
        {
          id: `tmp-${Date.now()}`,
          title: payload?.title || "Thông báo",
          body: payload?.body || "",
          is_read: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNbUnread((x) => x + 1);
    };
    socket.on(channel, handler);
    return () => socket.off(channel, handler);
  }, [user?.id]);

  const markAllRead = async () => {
    if (!token) return;
    try {
      await api.patch(
        `${API}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      /* ignore */
    }
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setNbUnread(0);
  };

  const clearAllNotifs = async () => {
    if (!token) return;
    try {
      await api.delete(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* ignore */
    }
    setNotifs([]);
    setNbUnread(0);
  };

  return (
    // tăng z-index của header để che nội dung trang
    <header className="bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-md sticky top-0 z-[60]">
      <div className={isScrolled ? "py-2" : "py-4"}>
        <div className="container mx-auto flex items-center justify-between px-6 relative">
          {/* trái: menu + logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Mở menu"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/25 hover:bg-white/35 shadow"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>

            <Link to="/" className="flex items-center gap-2 ml-1 md:ml-2">
              <img
                src="/logo.png"
                alt="UniTrade"
                className="h-12 w-12 object-contain bg-white rounded-full shadow"
              />
              <span className="text-2xl font-bold">
                Uni<span className="text-yellow-200">Trade</span>
              </span>
            </Link>
          </div>

          {/* search */}
          <form
            onSubmit={handleSearch}
            className="relative flex bg-white rounded-full shadow overflow-hidden w-full max-w-[720px] mx-4"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Tìm kiếm sản phẩm..."
              className="flex-1 px-4 py-2 text-gray-700 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-orange-600 px-5 font-semibold hover:bg-orange-700 transition"
            >
              Tìm
            </button>

            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 w-full bg-white text-gray-800 rounded-lg shadow-lg z-[70] mt-1 overflow-hidden">
                {loading ? (
                  <li className="px-4 py-3 text-center text-sm text-gray-500">
                    Đang tìm kiếm...
                  </li>
                ) : (
                  suggestions.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => navigate(`/products/${p.id}`)}
                    >
                      <img
                        src={
                          p.image_url ||
                          "https://via.placeholder.com/80x80?text=No+Image"
                        }
                        alt={p.name}
                        className="w-10 h-10 rounded object-cover border"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Intl.NumberFormat("vi-VN").format(p.price || 0)} đ
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </form>

          {/* phải */}
          <div className="flex items-center gap-3 ml-4">
            <Link
              to="/favorites"
              aria-label="Tin yêu thích"
              className="p-2 rounded-full hover:bg-white/15"
            >
              <Heart className="w-7 h-7 text-pink-100" />
            </Link>
            <Link
              to="/messages"
              aria-label="Tin nhắn"
              className="p-2 rounded-full hover:bg-white/15"
            >
              <MessageCircle className="w-7 h-7 text-blue-100" />
            </Link>
            <Link
              to="/post/create"
              aria-label="Đăng bài"
              className="p-2 rounded-full hover:bg-white/15"
            >
              <PlusCircle className="w-7 h-7 text-emerald-100" />
            </Link>

            {/* chuông */}
            {user && (
              <div className="relative" ref={nbRef}>
                <button
                  onClick={() => setNbOpen((v) => !v)}
                  className="relative p-2 rounded-full hover:bg-white/15"
                  aria-label="Thông báo"
                >
                  <Bell className="w-7 h-7 text-white/95" />
                  {nbUnread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center">
                      {nbUnread > 99 ? "99+" : nbUnread}
                    </span>
                  )}
                </button>

                {/* z-index cao để không bị slogan đè */}
                <div
                  className={`absolute right-0 mt-2 w-[22rem] bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 origin-top-right transform transition duration-150 z-[90] ${
                    nbOpen
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-white z-[1] rounded-t-xl">
                    <div className="font-semibold">Thông báo</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={markAllRead}
                        className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        <CheckCheck className="w-4 h-4" /> Đã đọc
                      </button>
                      <button
                        onClick={clearAllNotifs}
                        className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" /> Xoá
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-gray-500 text-center">
                        Chưa có thông báo.
                      </div>
                    ) : (
                      notifs.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b last:border-b-0 ${
                            n.is_read ? "bg-white" : "bg-orange-50"
                          }`}
                        >
                          <div className="text-sm font-medium">{n.title}</div>
                          {n.body && (
                            <div className="text-sm text-gray-600 mt-0.5">
                              {n.body}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(n.created_at).toLocaleString("vi-VN")}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* user menu */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <span className="hidden md:block font-medium">
                    Xin chào, {user.username || user.email}
                  </span>
                  <User className="w-8 h-8" />
                  {isAdmin && (
                    <CheckCircle2
                      className="w-4 h-4 text-green-300 ml-1"
                      title="Admin verified"
                    />
                  )}
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-56 bg-white text-gray-700 rounded-lg shadow-lg z-[80] overflow-hidden">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      <User className="w-4 h-4 text-sky-500" /> Hồ sơ chi tiết
                    </Link>

                    <Link
                      to="/myposts"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-500" /> Tin đã
                      đăng
                    </Link>

                    <Link
                      to="/favorites"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      <Heart className="w-4 h-4 text-pink-500" /> Tin yêu thích
                    </Link>

                    <Link
                      to="/orders/buyer"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      <ListChecks className="w-4 h-4 text-indigo-600" /> Đơn hàng
                      của tôi
                    </Link>

                    <Link
                      to="/seller/orders"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      <ListChecks className="w-4 h-4 text-purple-600" /> Quản lý
                      đơn bán
                    </Link>

                    <Link
                      to="/seller/dashboard"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      <BarChart3 className="w-4 h-4 text-orange-500" /> Bảng điều
                      khiển bán hàng
                    </Link>

                    {isAdmin && (
                      <>
                        <Link
                          to="/admin/users"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 font-medium"
                          onClick={() => setOpen(false)}
                        >
                          <Shield className="w-4 h-4 text-indigo-600" /> Quản trị
                          người dùng
                        </Link>
                        <Link
                          to="/admin/notify"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 font-medium"
                          onClick={() => setOpen(false)}
                        >
                          <Bell className="w-4 h-4 text-orange-600" /> Gửi thông
                          báo
                        </Link>
                      </>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setOpen(false);
                      }}
                      className="w-full flex items-center gap-2 text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="bg-white text-orange-600 px-4 py-2 rounded-full font-semibold"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full font-semibold border border-white/70"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slogan luôn hiển thị, đặt z thấp hơn dropdown */}
      {location.pathname === "/" && (
        <div className="container mx-auto text-center px-6 pb-8 relative z-[10]">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 drop-shadow">
            UniTrade –{" "}
            <span className="text-yellow-100">
              An Toàn - Tiện Lợi – Tin Cậy
            </span>
          </h1>
          <p className="text-lg md:text-xl opacity-90">
            Sàn Thương Mại Điện Tử Dành Cho Sinh Viên
          </p>
        </div>
      )}
    </header>
  );
}
