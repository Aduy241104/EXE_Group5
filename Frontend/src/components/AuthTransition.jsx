import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export default function AuthTransition({ children }) {
  const location = useLocation();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 via-amber-300 to-pink-400 overflow-hidden">
      {/* Nền gradient động glow */}
      <motion.div
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-amber-300 bg-[length:200%_200%] opacity-30 blur-3xl"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative z-10 w-[90%] max-w-md"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
