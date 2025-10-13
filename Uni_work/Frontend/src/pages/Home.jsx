// src/pages/Home.jsx
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import FeaturedProducts from "../components/product/FeaturedProducts";
import ProductGrid from "../components/product/ProductGrid";

export default function Home() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("latest"); // "forYou" | "latest"

  // Chỉ để hiển thị trạng thái lọc trên đầu trang (ProductGrid sẽ tự fetch theo URL)
  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";
  const category = params.get("category") || "";

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Nội dung */}
      <main className="relative z-10 px-4 md:px-8 py-6">
        {/* Tabs */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-6 border-b relative">
            {["forYou", "latest"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 font-semibold relative ${
                  activeTab === tab
                    ? "text-orange-600"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                {tab === "forYou" ? "Dành cho bạn" : "Mới nhất"}
                {activeTab === tab && (
                  <motion.div
                    layoutId="underline-tab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Trạng thái lọc (nếu có) */}
        {(q || category) && (
          <p className="text-sm text-gray-500 mb-3">
            Lọc theo {q ? <>từ khóa <b>“{q}”</b></> : null}
            {q && category ? " · " : ""}
            {category ? <>danh mục <b>{category}</b></> : null}
          </p>
        )}

        {/* Block: Sản phẩm nổi bật */}
        <FeaturedProducts />

        {/* Grid sản phẩm với phân trang tự động */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + q + category}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <ProductGrid />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
