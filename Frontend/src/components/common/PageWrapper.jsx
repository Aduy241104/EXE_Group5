// src/components/common/PageWrapper.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * - Fade-in khi pathname đổi
 * - Sau đó reload đúng 1 lần / pathname dùng sessionStorage
 */
const FADE_DURATION_MS = 320;

export default function PageWrapper({ children, className = "" }) {
  const { pathname } = useLocation();

  useEffect(() => {
    const key = `reloaded:${pathname}`;
    if (!sessionStorage.getItem(key)) {
      const t = setTimeout(() => {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }, FADE_DURATION_MS + 30);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: FADE_DURATION_MS / 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
