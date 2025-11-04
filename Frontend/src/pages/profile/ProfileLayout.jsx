import { Link, Outlet, useLocation } from "react-router-dom";
import { useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "@/context/AuthContext";
import {
  UserRound, Heart, Star, MapPin, Settings, LogOut,
} from "lucide-react";

export default function ProfileLayout() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const active = location.pathname;

  const avatarSrc =
    user?.avatar_url?.startsWith("http")
      ? user.avatar_url
      : user?.avatar_url
      ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${user.avatar_url.replace(/^\/+/, "")}`
      : "/default-avatar.png";

  const menu = [
    { path: "/profile", label: "Thông tin cá nhân", icon: UserRound },
    { path: "/profile/favorites", label: "Yêu thích", icon: Heart },
    { path: "/profile/reviews", label: "Đánh giá của tôi", icon: Star },
    { path: "/profile/addresses", label: "Địa chỉ", icon: MapPin },
    { path: "/profile/settings", label: "Cài đặt", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-10 px-4 md:px-10">
      <motion.div
        className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full md:w-1/4 rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-6 flex flex-col items-center text-center border-b border-gray-100">
            <img
              src={avatarSrc}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover border-4 border-blue-100 shadow-sm mb-3"
            />
            <h2 className="font-semibold text-gray-800 text-lg">{user?.name || "Người dùng"}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          <nav className="flex flex-col p-3">
            {menu.map(({ path, label, icon: Icon }) => {
              const activeTab = active === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-all duration-200 ${
                    activeTab
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-blue-50"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 mt-4 text-red-600 bg-red-50 hover:bg-red-100 py-2 rounded-xl font-medium transition"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </nav>
        </motion.aside>

        {/* Main content */}
        <AnimatePresence mode="wait">
          <motion.section
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-lg p-6"
          >
            <Outlet />
          </motion.section>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
