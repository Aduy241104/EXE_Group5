import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Heart, MessageCircle, PlusCircle, User, ListChecks, BarChart3, LogOut,
  Shield, CheckCircle2, Menu, Bell, Trash2, CheckCheck, Megaphone, TicketPercent
} from "lucide-react";
import { io } from "socket.io-client";
import { API } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

// Animations (vẫn giữ để sau này dùng nếu cần)
const sloganContainer = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.15 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.3, ease: "easeIn" } }
};
const sloganLine = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: "easeIn" } }
};

const socket = io(API, { transports: ["websocket"], autoConnect: true });

// build URL ảnh + fallback cho suggestion
const isAbs = (u) => /^https?:\/\//i.test(u || "");
const buildImg = (raw) => {
  if (!raw) return "/logo.png";
  if (isAbs(raw)) return raw;
  if (raw.startsWith("/uploads/")) return `${API}${raw}`;
  if (raw.startsWith("uploads/")) return `${API}/${raw}`;
  return `${API}/uploads/${raw}`;
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [nbOpen, setNbOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [nbUnread, setNbUnread] = useState(0);

  const dropdownRef = useRef(null);
  const nbRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/"; // vẫn giữ biến này nếu sau cần dùng

  const onToggleSidebar = () => {
    window.dispatchEvent(new CustomEvent("sidebar:toggle"));
    document.body.classList.toggle("sidebar-open");
  };

  // đóng dropdown khi click ngoài
  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
      if (nbRef.current && !nbRef.current.contains(e.target)) setNbOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // clear suggest/search khi đổi route
  useEffect(() => {
    setSuggestions([]);
    setSearchTerm("");
  }, [location.pathname]);

  // search suggest
  useEffect(() => {
    if (!searchTerm.trim()) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/products/search", { params: { q: searchTerm } });
        setSuggestions((res.data || []).slice(0, 6));
      } catch {}
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    setSuggestions([]);
  };

  // notifications realtime (demo)
  useEffect(() => {
    if (!user?.id) return;
    const ch = `notification:new:${user.id}`;
    const handler = (p) => {
      setNotifs((prev) => [
        { id: `tmp-${Date.now()}`, title: p?.title || "Thông báo", body: p?.body || "", is_read: false, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setNbUnread((x) => x + 1);
    };
    socket.on(ch, handler);
    return () => socket.off(ch, handler);
  }, [user?.id]);

  const markAllRead = async () => {
    try { await api.patch("/api/notifications/read-all", {}); } catch {}
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setNbUnread(0);
  };
  const clearAllNotifs = async () => {
    try { await api.delete("/api/notifications"); } catch {}
    setNotifs([]); setNbUnread(0);
  };

  return (
    <header className="bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-md sticky top-0 z-[60]">
      {/* Hàng chính: logo + actions */}
      <div className="py-3">
        <div className="container mx-auto flex items-center justify-between px-6 relative">
          {/* trái */}
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

          {/* phải */}
          <div className="flex items-center gap-3 ml-4">
            {isAdmin && (
              <Link
                to="/admin/notify"
                className="p-2 rounded-full hover:bg-white/15"
                title="Gửi thông báo đến người dùng"
              >
                <Megaphone className="w-7 h-7" />
              </Link>
            )}

            <Link to="/favorites" aria-label="Tin yêu thích" className="p-2 rounded-full hover:bg-white/15">
              <Heart className="w-7 h-7 text-pink-100" />
            </Link>
            <Link to="/messages" aria-label="Tin nhắn" className="p-2 rounded-full hover:bg-white/15">
              <MessageCircle className="w-7 h-7 text-blue-100" />
            </Link>
            <Link to="/post/create" aria-label="Đăng bài" className="p-2 rounded-full hover:bg-white/15">
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

                <div
                  className={`absolute right-0 mt-2 w-[22rem] bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 origin-top-right transition z-[90] ${
                    nbOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
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

            {/* user menu – có animation */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="group flex items-center gap-2 focus:outline-none"
                  aria-haspopup="menu"
                  aria-expanded={open}
                >
                  <span className="hidden md:block font-medium">
                    Xin chào, {user.username || user.email}
                  </span>
                  <div className="relative">
                    <User className="w-8 h-8 transition-transform group-hover:scale-105" />
                    {isAdmin && (
                      <CheckCircle2
                        className="w-4 h-4 text-green-400 absolute -right-1 -bottom-1"
                        title="Admin verified"
                      />
                    )}
                  </div>
                  <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    ▾
                  </motion.span>
                </button>

                {/* backdrop bắt click ngoài khi open */}
                <AnimatePresence>
                  {open && (
                    <motion.button
                      key="backdrop"
                      className="fixed inset-0 z-[59] cursor-default" // dưới z của header
                      onClick={() => setOpen(false)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {open && (
                    <motion.div
                      key="menu"
                      className="absolute right-0 mt-2 w-56 bg-white text-gray-700 rounded-lg shadow-lg z-[80] overflow-hidden ring-1 ring-black/5 origin-top-right"
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    >
                      <MenuLink to="/profile" onClick={() => setOpen(false)}>
                        <User className="w-4 h-4 text-sky-500" /> Hồ sơ chi tiết
                      </MenuLink>
                      <MenuLink to="/myposts" onClick={() => setOpen(false)}>
                        <PlusCircle className="w-4 h-4 text-emerald-500" /> Tin đã đăng
                      </MenuLink>
                      <MenuLink to="/favorites" onClick={() => setOpen(false)}>
                        <Heart className="w-4 h-4 text-pink-500" /> Tin yêu thích
                      </MenuLink>
                      <MenuLink to="/orders/buyer" onClick={() => setOpen(false)}>
                        <ListChecks className="w-4 h-4 text-indigo-600" /> Đơn hàng của tôi
                      </MenuLink>
                      <MenuLink to="/seller/orders" onClick={() => setOpen(false)}>
                        <ListChecks className="w-4 h-4 text-purple-600" /> Quản lý đơn bán
                      </MenuLink>
                      <MenuLink to="/seller/dashboard" onClick={() => setOpen(false)}>
                        <BarChart3 className="w-4 h-4 text-orange-500" /> Bảng điều khiển bán hàng
                      </MenuLink>
                      <MenuLink to="/seller/vouchers" onClick={() => setOpen(false)}>
                        <TicketPercent className="w-4 h-4 text-emerald-600" /> Voucher của tôi
                      </MenuLink>

                      {isAdmin && (
                        <>
                          <div className="px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-gray-400">
                            Quản trị
                          </div>
                          <MenuLink to="/admin/users" onClick={() => setOpen(false)} bold>
                            <Shield className="w-4 h-4 text-indigo-600" /> Quản trị người dùng
                          </MenuLink>
                          <MenuLink to="/admin/notify" onClick={() => setOpen(false)} bold>
                            <Megaphone className="w-4 h-4 text-orange-600" /> Gửi thông báo
                          </MenuLink>
                          <div className="px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-gray-400">
                            Voucher
                          </div>
                          <MenuLink to="/admin/vouchers" onClick={() => setOpen(false)}>
                            <TicketPercent className="w-4 h-4 text-teal-600" /> Quản trị voucher
                          </MenuLink>
                          <MenuLink to="/admin/vouchers/new" onClick={() => setOpen(false)}>
                            <PlusCircle className="w-4 h-4 text-emerald-600" /> Tạo voucher
                          </MenuLink>
                        </>
                      )}

                      <button
                        onClick={() => { logout(); setOpen(false); }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="bg-white text-orange-600 px-4 py-2 rounded-full font-semibold">Đăng nhập</Link>
                <Link to="/register" className="px-4 py-2 rounded-full font-semibold border border-white/70">Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ⛔ HeaderHero / Slogan + Search ở Topbar đã ẨN HOÀN TOÀN (đã gỡ khối dưới) */}
      {/*
      <AnimatePresence mode="wait">
        {!isHome && ( ... toàn bộ block slogan + search ... )}
      </AnimatePresence>
      */}
    </header>
  );
}

/* helper cho item trong dropdown */
function MenuLink({ to, onClick, children, bold = false }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 ${bold ? "font-medium" : ""}`}
    >
      {children}
    </Link>
  );
}
