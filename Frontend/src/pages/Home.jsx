import { motion, AnimatePresence } from "framer-motion";
import HeaderHero from "@/components/common/HeaderHero";
import CategoryBar from "@/components/nav/CategoryBar";
import FeaturedProducts from "@/components/product/FeaturedProducts";
import FlashSaleStrip from "@/components/product/FlashSaleStrip";
import Collections from "@/components/product/Collections";
import SellerSpotlight from "@/components/seller/SellerSpotlight";
import AppBanner from "@/components/common/AppBanner";
import ProductGrid from "@/components/product/ProductGrid";
import { useLocation } from "react-router-dom";
import ServiceHighlights from "@/components/common/ServiceHighlights";
import BannerCarousel from "@/components/common/BannerCarousel"; // tạo file này

export default function Home() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="relative flex flex-col min-h-screen">
      <main className="relative z-0"></main>
      <div className="container mx-auto px-6 -mt-1">
        <CategoryBar />
      </div>
{/* {isHome && <BannerCarousel />} */}

      {isHome && (
  <HeaderHero bgImageUrl="/assets/hero/uni-hero.jpg">
    <BannerCarousel />   {/* 👈 hiển thị banner vào ô xám bên phải */}
  </HeaderHero>
)}

      {/* Nội dung chính */}
      <main className="relative z-10">

                <ServiceHighlights
                className="relative bg-gradient-to-b from-blue-50 via-white to-blue-50 border-y border-blue-100 py-14 mt-10 overflow-hidden"
                />

        {/* Featured slider gọi riêng */}
        <section className="container mx-auto px-6 mt-6">
          <FeaturedProducts />
        </section>

        {/* Flash sale */}
        <section className="container mx-auto px-6 mt-6">
          <FlashSaleStrip />
        </section>

{/* Product Grid (10 sản phẩm random) */}
<section className="px-4 md:px-8 py-6">
  <div className="flex items-baseline gap-3 mb-4">
    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
      Gợi ý ngẫu nhiên hôm nay
    </h2>
    <div className="h-2 w-24 rounded bg-gradient-to-r bg-blue-600" />
  </div>

  <AnimatePresence mode="wait">
    <motion.div
      key="home-grid"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="container mx-auto"
    >
      <ProductGrid showTabs={false} />
    </motion.div>
  </AnimatePresence>
</section>


        {/* Collections + Seller spotlight */}
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
