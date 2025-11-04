import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import ProductGrid from "@/components/product/ProductGrid";
import FlashSaleStrip from "@/components/product/FlashSaleStrip";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";

export default function ProductList() {
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    cat: "",
    q: "",
    min: 0,
    max: 5000000,
    sort: "newest",
  });
  const [searchParams] = useSearchParams();

  // Khi user click từ CategoryBar → /products?cat=Thời trang
  useEffect(() => {
    const cat = searchParams.get("cat");
    if (cat) setFilters((f) => ({ ...f, cat }));
  }, [searchParams]);

  const handleDataLoaded = (data) => {
    if (!data.length) setHasMore(false);
    setAllItems((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const merged = [...prev, ...data.filter((p) => !ids.has(p.id))];
      return merged;
    });
  };

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setPage((p) => p + 1);
      setLoadingMore(false);
    }, 400);
  };

  const updateFilter = (key, val) => {
    setPage(1);
    setAllItems([]);
    setHasMore(true);
    setFilters((f) => ({ ...f, [key]: val }));
  };

  const categories = ["Tất cả", "Công nghệ", "Thời trang", "Học tập", "Gia dụng"];
  const sortOptions = [
    { key: "newest", label: "Mới nhất" },
    { key: "price_asc", label: "Giá tăng dần" },
    { key: "price_desc", label: "Giá giảm dần" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/40">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Flash Sale Section */}
        <FlashSaleStrip />

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mt-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Danh sách sản phẩm</h1>
            <p className="text-gray-500 text-sm mt-1">
              Tìm kiếm và khám phá các sản phẩm hot nhất hôm nay 🔥
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={filters.q}
              onChange={(e) => updateFilter("q", e.target.value)}
              className="outline-none text-sm w-48 md:w-72"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar bộ lọc */}
          <motion.aside
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-fit"
          >
            <div className="flex items-center gap-2 mb-4 text-blue-600 font-semibold">
              <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
            </div>

            {/* Danh mục */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Danh mục</h3>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li
                    key={c}
                    onClick={() => updateFilter("cat", c === "Tất cả" ? "" : c)}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all duration-200 ${
                      filters.cat === c || (c === "Tất cả" && !filters.cat)
                        ? "bg-blue-100 text-blue-700 font-medium shadow-sm scale-[1.02]"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Giá */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Khoảng giá</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Từ"
                  value={filters.min}
                  onChange={(e) => updateFilter("min", e.target.value)}
                  className="w-1/2 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  placeholder="Đến"
                  value={filters.max}
                  onChange={(e) => updateFilter("max", e.target.value)}
                  className="w-1/2 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                />
              </div>
            </div>

            {/* Sắp xếp */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Sắp xếp theo</h3>
              <select
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </motion.aside>

          {/* Danh sách sản phẩm */}
          <main className="md:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={filters.cat + filters.q + filters.sort + filters.min + filters.max + page}
                initial={{ opacity: 0, scale: 0.97, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <ProductGrid
                  showTabs={false}
                  limit={12}
                  page={page}
                  onDataLoaded={handleDataLoaded}
                  filters={filters}
                />
              </motion.div>
            </AnimatePresence>

            {/* Nút Xem thêm */}
            <div className="flex justify-center mt-8">
              {hasMore ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow disabled:opacity-60"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Đang tải...
                    </>
                  ) : (
                    "Xem thêm"
                  )}
                </motion.button>
              ) : (
                <p className="text-gray-500 text-sm">
                  Đã hiển thị toàn bộ sản phẩm 🎉
                </p>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
