import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BannerManager from "@/pages/admin/BannerManager";

import { Users, Megaphone, TicketPercent, Image as ImageIcon } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function AdminDashboard() {
  const location = useLocation();
  const initialTab = location.state?.tab || "banner";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Nếu user chuyển sang tab khác qua dropdown
  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location.state]);

  const TABS = [
    { key: "banner", label: "Banner", icon: ImageIcon },
    { key: "users", label: "Người dùng", icon: Users },
    { key: "notifications", label: "Thông báo", icon: Megaphone },
    { key: "voucher", label: "Quản trị Voucher", icon: TicketPercent },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.h1
          className="text-3xl font-bold text-gray-800 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Bảng điều khiển Quản trị
        </motion.h1>

        {/* Thanh tab điều hướng */}
        <div className="flex flex-wrap gap-3 mb-6">
          {TABS.map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white border-blue-600 shadow"
                  : "border-gray-300 text-gray-700 hover:bg-blue-50"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Nội dung động */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            {activeTab === "banner" && <BannerManager />}
            {activeTab === "users" && (
              <div className="text-center text-gray-500 py-20">
                👥 Quản lý người dùng (đang phát triển)
              </div>
            )}
            {activeTab === "notifications" && (
              <div className="text-center text-gray-500 py-20">
                📢 Gửi thông báo (đang phát triển)
              </div>
            )}
            {activeTab === "voucher" && (
              <div className="text-center text-gray-500 py-20">
                🎟️ Quản trị voucher (đang phát triển)
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}