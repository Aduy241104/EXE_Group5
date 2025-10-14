import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import PostTable from "@/components/posts/PostTable";
import { Link } from "react-router-dom";
import { Plus, Search, RefreshCcw } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang hiển thị" },
  { value: "hidden", label: "Bị ẩn" },
  { value: "sold", label: "Đã bán" },
  { value: "expired", label: "Hết hạn" },
];

export default function MyPosts() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchMyProducts = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/api/products/mine");
      const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
      const normalized = rows.map((p) => ({
        id: p.id,
        title: p.name || p.title || "",
        price: Number(p.price || 0),
        status: p.status || "active",
        created_at: p.created_at,
        thumbnail_url: p.image_url || p.image || p.thumbnail,
        views: p.views || 0,
        favorites: p.favorites || 0,
        messages: p.messages || 0,
        orders: p.orders || 0,
      }));
      setItems(normalized);
    } catch (e) {
      console.error("❌ /api/products/mine:", e?.response?.data || e);
      setItems([]);
      setErr(e?.response?.data?.error || "Không tải được danh sách bài đăng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyProducts(); }, []);

  const filtered = useMemo(() => {
    return items.filter((p) =>
      (status === "all" || p.status === status) &&
      (q.trim() === "" || (p.title || "").toLowerCase().includes(q.toLowerCase()))
    );
  }, [items, q, status]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="mb-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 p-5 text-white shadow-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold drop-shadow">Tin đã đăng</h1>
            <p className="text-white/90">Quản lý bài đăng, gia hạn, chỉnh sửa và theo dõi hiệu quả</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/post/create"
              className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 font-semibold text-orange-600 shadow hover:bg-white"
            >
              <Plus className="h-4 w-4" /> Đăng tin mới
            </Link>
            <button
              onClick={fetchMyProducts}
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 font-semibold text-white ring-1 ring-white/30 hover:bg-white/25"
            >
              <RefreshCcw className="h-4 w-4" /> Tải lại
            </button>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tiêu đề..."
            className="w-full rounded-xl border px-10 py-2 outline-none ring-orange-200 focus:ring-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Trạng thái:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2 outline-none ring-orange-200 focus:ring-2"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Table */}
      <PostTable loading={loading} items={filtered} onRefresh={fetchMyProducts} />
    </div>
  );
}
