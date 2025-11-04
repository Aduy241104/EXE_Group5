import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Quản lý filter danh mục (single/multi), đồng bộ URL ?cat=...
 */
const CategoryFilterContext = createContext(null);

export function CategoryFilterProvider({
  children,
  multiple = false,     // nếu muốn lọc nhiều danh mục một lúc, đặt true ở page riêng
  urlSync = true,       // bật đồng bộ query param ?cat=...
  initial = null,       // giá trị khởi tạo
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const readFromUrl = () => {
    if (!urlSync) return null;
    const q = new URLSearchParams(location.search);
    const arr = q.getAll("cat");
    if (arr.length) return multiple ? arr : arr[0];
    const one = q.get("category") || q.get("cat"); // fallback
    return one ? (multiple ? [one] : one) : null;
  };

  const [value, setValue] = useState(() => readFromUrl() ?? (multiple ? [] : initial));

  const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

  // khi value đổi -> sync URL + phát event global
  useEffect(() => {
    if (!urlSync) return;
    const q = new URLSearchParams(location.search);
    q.delete("category");
    q.delete("cat");

    const arr = toArray(value);
    if (arr.length) {
      if (multiple) arr.forEach((c) => q.append("cat", c));
      else q.set("cat", arr[0]);
    }

    navigate({ pathname: location.pathname, search: `?${q.toString()}` }, { replace: true });

    window.dispatchEvent(
      new CustomEvent("filter:category", {
        detail: { category: multiple ? arr : arr[0] || null, multiple },
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(toArray(value)), multiple]);

  // khi back/forward làm URL đổi -> sync ngược
  useEffect(() => {
    const v = readFromUrl();
    if (v !== null) setValue(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const api = useMemo(() => {
    return {
      value,
      multiple,
      setCategory: (next) =>
        setValue(multiple ? toArray(next) : Array.isArray(next) ? next[0] ?? null : next),
      toggleCategory: (key) => {
        if (!multiple) {
          setValue((prev) => (prev === key ? null : key));
          return;
        }
        setValue((prev) => {
          const s = new Set(toArray(prev));
          s.has(key) ? s.delete(key) : s.add(key);
          return Array.from(s);
        });
      },
      clearCategory: () => setValue(multiple ? [] : null),
    };
  }, [value, multiple]);

  return (
    <CategoryFilterContext.Provider value={api}>{children}</CategoryFilterContext.Provider>
  );
}

export function useCategoryFilter() {
  const ctx = useContext(CategoryFilterContext);
  if (!ctx) throw new Error("useCategoryFilter must be used within CategoryFilterProvider");
  return ctx;
}
