// src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Cuộn lên đầu mỗi khi path thay đổi
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null; // không render gì ra màn hình
}