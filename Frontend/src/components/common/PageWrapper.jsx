import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

/**
 * ⚡ PageWrapper (SPA Transition + Smooth Loading)
 * - Hiệu ứng fade in/out mượt mà giữa các trang
 * - Tự động scroll lên đầu khi đổi route
 * - Có spinner ngắn để cảm giác chuyển trang "liền mạch"
 * - Không reload thật (SPA 100%)
 */

export default function PageWrapper({ children, className = "" }) {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(true);

  // Mỗi khi pathname đổi → trigger animation + scroll top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 450); // thời gian fade / load giả lập

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        // 🔵 Loading animation (giữa chuyển trang)
        <motion.div
          key="page-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center h-[60vh] text-gray-500"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "linear",
            }}
          >
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </motion.div>
          <p className="mt-3 text-sm text-gray-500">Đang tải trang...</p>
        </motion.div>
      ) : (
        // 🌟 Page content with fade transition
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={`min-h-screen ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
