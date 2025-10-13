// src/pages/Home.jsx
import { motion, AnimatePresence } from "framer-motion";
import ProductGrid from "@/components/product/ProductGrid";

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen">
      <main className="relative z-10 px-4 md:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key="home-grid"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <ProductGrid showTabs />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
