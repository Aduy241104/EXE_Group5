import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Grid,
  Laptop,
  Shirt,
  BookOpen,
  Lamp,
  PhoneCall,
  ChevronDown,
  Info,
  HelpCircle,
} from "lucide-react";

/* ---------- Ripple Button (hiệu ứng click gợn sóng) ---------- */
function RippleLink({ to, className, children, onClick }) {
  const rippleRef = useRef(null);

  const createRipple = (event) => {
    const button = rippleRef.current;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${
      event.clientX - button.getBoundingClientRect().left - radius
    }px`;
    circle.style.top = `${
      event.clientY - button.getBoundingClientRect().top - radius
    }px`;
    circle.classList.add("ripple");
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) ripple.remove();
    button.appendChild(circle);
  };

  return (
    <Link
      ref={rippleRef}
      to={to}
      onClick={(e) => {
        createRipple(e);
        onClick?.(e);
      }}
      className={`relative overflow-hidden select-none ${className}`}
    >
      {children}
    </Link>
  );
}

/* ---------- CSS Ripple + Underline glow ---------- */
const customStyle = `
.ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  animation: ripple 650ms ease-out;
  background-color: rgba(59, 130, 246, 0.3);
  pointer-events: none;
}
@keyframes ripple {
  to { transform: scale(3.5); opacity: 0; }
}

@keyframes shimmer {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
`;

export default function CategoryBar() {
  const location = useLocation();
  const [hovered, setHovered] = useState(null);

  const categories = [
    { key: "home", label: "Trang chủ", icon: Home, path: "/" },
    {
      key: "category",
      label: "Danh mục",
      icon: Grid,
      path: "/products",
      sub: [
        { label: "Công nghệ", icon: Laptop, path: "/category/tech" },
        { label: "Thời trang", icon: Shirt, path: "/category/fashion" },
        { label: "Học tập", icon: BookOpen, path: "/category/study" },
        { label: "Gia dụng", icon: Lamp, path: "/category/furniture" },
      ],
    },
    { key: "contact", label: "Liên hệ", icon: PhoneCall, path: "/contact" },
    { key: "about", label: "Giới thiệu UniTrade", icon: Info, path: "/about" },
    { key: "help", label: "Trung tâm hỗ trợ", icon: HelpCircle, path: "/help" }, // ✅ Help Center mới
  ];

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = customStyle;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-hide">
        <ul className="flex items-center gap-6 py-3 min-w-max text-sm font-medium text-gray-700 relative">
          {categories.map((c) => {
            const Icon = c.icon;
            const hasSub = Array.isArray(c.sub);
            const active = isActive(c.path);

            return (
              <motion.li
                key={c.key}
                onMouseEnter={() => hasSub && setHovered(c.key)}
                onMouseLeave={() => setHovered(null)}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 350, damping: 18 }}
                className="relative group"
              >
                {/* Ripple link */}
                <RippleLink
                  to={c.path}
                  className={`flex items-center gap-2 px-2 py-1 transition-all duration-300 ${
                    active
                      ? "text-blue-600 font-semibold"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  <motion.div
                    animate={{ scale: active ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="whitespace-nowrap relative">
                      {active && (
                        <motion.span
                          layoutId="highlight-bg"
                          className="absolute inset-0 -z-10 rounded-md bg-blue-100/60 blur-sm"
                          animate={{
                            opacity: [0.6, 0.85, 0.6],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                      {c.label}
                    </span>
                    {hasSub && (
                      <ChevronDown className="w-4 h-4 opacity-60 group-hover:rotate-180 transition-transform duration-300" />
                    )}
                  </motion.div>
                </RippleLink>

                {/* underline glowing motion */}
                {active && (
                  <motion.span
                    layoutId="underline"
                    className="absolute -bottom-[2px] left-1/2 h-[3px] w-9 -translate-x-1/2 rounded-full shadow-md"
                    style={{
                      background:
                        "linear-gradient(90deg, #3b82f6, #38bdf8, #0ea5e9, #3b82f6)",
                      backgroundSize: "200% 200%",
                      animation: "shimmer 2.5s linear infinite",
                      boxShadow: "0 0 6px rgba(56,189,248,0.6)",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                    }}
                  />
                )}

                {/* Dropdown animation */}
                <AnimatePresence>
                  {hovered === c.key && hasSub && (
                    <motion.ul
                      initial={{ opacity: 0, y: -10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.97 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="absolute top-10 left-0 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-56 overflow-hidden z-50"
                    >
                      {c.sub.map((s) => (
                        <motion.li
                          key={s.path}
                          whileHover={{
                            backgroundColor: "rgba(59,130,246,0.06)",
                            x: 4,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <Link
                            to={s.path}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition"
                          >
                            <s.icon className="w-4 h-4 text-blue-500" />
                            <span>{s.label}</span>
                          </Link>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
