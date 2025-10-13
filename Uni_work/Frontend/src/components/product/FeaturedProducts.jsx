// src/components/product/FeaturedProducts.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function FeaturedProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);
  const pausedRef = useRef(false);

  // fetch 10 sp nổi bật / ngẫu nhiên
  useEffect(() => {
    let stopped = false;

    async function load() {
      try {
        setLoading(true);

        const urls = [
          `${API}/api/products/featured`,
          `${API}/api/products?limit=10&rand=1`,
        ];

        let data = [];
        for (const u of urls) {
          try {
            const r = await fetch(u);
            const j = await r.json();
            data = Array.isArray(j) ? j : j.items || [];
            if (data.length) break;
          } catch {
            // thử endpoint tiếp theo
          }
        }

        if (!stopped) setItems((data || []).slice(0, 10));
      } catch {
        if (!stopped) setItems([]);
      } finally {
        if (!stopped) setLoading(false);
      }
    }
    load();

    return () => {
      stopped = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // auto scroll ngang (pause khi hover/drag)
  useEffect(() => {
    if (!items.length) return;
    const el = wrapRef.current;
    if (!el) return;

    const start = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (pausedRef.current) return;
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
        const next = atEnd ? 0 : el.scrollLeft + el.clientWidth;
        el.scrollTo({ left: next, behavior: "smooth" });
      }, 3000);
    };

    start();

    // pause on hover
    const onEnter = () => (pausedRef.current = true);
    const onLeave = () => (pausedRef.current = false);

    // pause khi người dùng scroll bằng tay
    let dragTimer;
    const onScroll = () => {
      pausedRef.current = true;
      clearTimeout(dragTimer);
      dragTimer = setTimeout(() => (pausedRef.current = false), 600);
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("scroll", onScroll);

    return () => {
      clearInterval(timerRef.current);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("scroll", onScroll);
    };
  }, [items.length]);

  if (loading) {
    return <div className="container mx-auto px-6 mt-4">Đang tải nổi bật…</div>;
  }
  if (!items.length) return null;

  return (
    <section className="container mx-auto px-6 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-orange-600">Sản phẩm nổi bật</h3>
        <Link to="/products" className="text-sm text-orange-600 hover:underline">
          Xem tất cả
        </Link>
      </div>

      <div
        ref={wrapRef}
        className="snap-x snap-mandatory overflow-x-auto no-scrollbar flex gap-4 pb-2"
      >
        {items.map((p) => {
          const src = p.image_url || "/default-product.jpg";
          return (
            <Link
              key={p.id}
              to={`/products/${p.id}`}
              className="min-w-[200px] max-w-[200px] snap-start border rounded-xl bg-white hover:shadow-md transition"
              title={p.name}
            >
              <img
                src={src}
                alt={p.name}
                className="w-full h-36 object-cover rounded-t-xl"
                onError={(e) => {
                  if (e.currentTarget.src !== window.location.origin + "/default-product.jpg") {
                    e.currentTarget.src = "/default-product.jpg";
                  }
                }}
              />
              <div className="p-3">
                <div className="text-sm font-semibold line-clamp-2">{p.name}</div>
                <div className="text-orange-600 font-bold mt-1">
                  {new Intl.NumberFormat("vi-VN").format(p.price || 0)} đ
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
