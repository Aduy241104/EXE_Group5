// src/pages/Home.jsx
import { motion, AnimatePresence } from "framer-motion";

// ====== Sections (đã gửi code ở các bước trước) ======
import HeaderHero from "@/components/common/HeaderHero";
import CategoryBar from "@/components/nav/CategoryBar";
import FeaturedProducts from "@/components/product/FeaturedProducts";
import FlashSaleStrip from "@/components/product/FlashSaleStrip";
import Collections from "@/components/product/Collections";
import SellerSpotlight from "@/components/seller/SellerSpotlight";
import AppBanner from "@/components/common/AppBanner";
import { useLocation } from "react-router-dom";
// ====== Grid chính (giữ logic & animation của bạn) ======
import ProductGrid from "@/components/product/ProductGrid";

export default function Home() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  return (
    <div className="relative flex flex-col min-h-screen">
      {isHome && <HeaderHero />} {/* ✅ chỉ hiển thị ở trang chủ */}

      

      {/* Main content */}
      <main className="relative z-10">
        {/* Category bar ngay dưới hero (nhẹ, không trùng overlay) */}
        <div className="container mx-auto px-6 -mt-6">
          <CategoryBar />
        </div>

        {/* Featured slider */}
        {/* <section className="container mx-auto px-6 mt-6">
          <FeaturedProducts />
        </section> */}

        {/* Flash sale (tự fallback nếu chưa có API riêng) */}
        <section className="container mx-auto px-6 mt-6">
          <FlashSaleStrip />
        </section>

        {/* Product Grid – GIỮ animation như file gốc của bạn */}
        <section className="px-4 md:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key="home-grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="container mx-auto"
            >
              <ProductGrid showTabs />
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Collections + Seller spotlight (2/3 + 1/3) */}
        <section className="container mx-auto px-6 mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Collections />
          </div>
          <div className="lg:col-span-1">
            <SellerSpotlight />
          </div>
        </section>

        {/* CTA banner cuối trang */}
        <section className="container mx-auto px-6 mt-10 mb-10">
          <AppBanner />
        </section>
      </main>
    </div>
  );
}
