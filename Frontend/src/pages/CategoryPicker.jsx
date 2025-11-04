// ====== CategoryPicker (fancy dropdown + animation) ======
// src/components/CategoryPicker.jsx
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

export default function CategoryPicker({ value, onChange, label = "Danh mục" }) {
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const btnRef = useRef(null);
  const listRef = useRef(null);

  // icon map
  const catIcon = (slug) => {
    const map = {
      "dien-thoai": "📱", "laptop": "💻", "may-anh": "📷", "tai-nghe": "🎧",
      "phu-kien": "📦", "sach-giao-trinh": "📘", "do-hoc-tap": "🎓", "do-ktx-phong-tro": "🏠",
      "gia-dung": "🏡", "thoi-trang": "👚", "xe-co": "🚲", "nhac-cu": "🎵", "khac": "…",
    };
    return map[slug] || "📁";
  };

  // fetch categories
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        let data;
        try { ({ data } = await api.get("/api/categories")); }
        catch { ({ data } = await api.get("/api/categories/all")); }
        if (mounted) setCats(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setErr("Không tải được danh mục");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selected = cats.find((c) => String(c.id) === String(value));

  // click ngoài để đóng
  useEffect(() => {
    const handler = (e) => {
      if (!open) return;
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target) &&
        listRef.current &&
        !listRef.current.contains(e.target)
      ) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  // keyboard nav
  const onKeyDown = (e) => {
    if (!open && ["ArrowDown", "Enter", " "].includes(e.key)) {
      e.preventDefault(); setOpen(true); return;
    }
    const idx = cats.findIndex((c) => String(c.id) === String(value));
    if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); }
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = cats[(idx + 1) % cats.length];
      if (next) onChange(String(next.id));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = cats[(idx - 1 + cats.length) % cats.length];
      if (prev) onChange(String(prev.id));
    } else if (e.key === "Enter") {
      e.preventDefault(); setOpen(false); btnRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {/* Trigger */}
      <button
        type="button"
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={`w-full flex items-center justify-between rounded-2xl border px-3 py-2
          ${open ? "border-amber-400 ring-2 ring-amber-100" : "border-gray-200"}
          bg-white text-left transition-all duration-200 ease-out`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg leading-none">{selected ? catIcon(selected.slug) : "📂"}</span>
          <span className={`text-sm ${selected ? "text-gray-900" : "text-gray-500"}`}>
            {selected ? selected.name : "— Chọn danh mục —"}
          </span>
        </span>
        <svg width="18" height="18" viewBox="0 0 20 20" className={`transition ${open ? "rotate-180" : ""}`}>
          <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Dropdown (🍎 Apple-style animation) */}
      <div
        ref={listRef}
        className={`absolute z-20 mt-2 w-full rounded-2xl border border-gray-100 bg-white/95 shadow-2xl backdrop-blur-md
          origin-top overflow-hidden transition-all duration-300
          ease-[cubic-bezier(.22,1,.36,1)]
          ${open
            ? "opacity-100 translate-y-0 scale-100 backdrop-blur-sm"
            : "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none"}`}
        role="listbox"
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        {loading && <div className="p-3 text-sm text-gray-500">Đang tải…</div>}
        {err && <div className="p-3 text-sm text-red-600">{err}</div>}
        {!loading && !err && (
          <ul className="max-h-60 overflow-auto py-2">
            {cats.map((c) => {
              const active = String(value) === String(c.id);
              return (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={active}
                  className={`px-3 py-2 cursor-pointer flex items-center gap-2 text-sm transition-colors
                    ${active
                      ? "bg-amber-50 text-amber-700"
                      : "hover:bg-gray-50 active:scale-[0.98]"}`}
                  onClick={() => { onChange(String(c.id)); setOpen(false); btnRef.current?.focus(); }}
                >
                  <span className="text-lg leading-none">{catIcon(c.slug)}</span>
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto text-xs text-gray-400">ID {c.id}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-1">Hệ thống lưu <b>ID</b> danh mục đã chọn.</p>
    </div>
  );
}


