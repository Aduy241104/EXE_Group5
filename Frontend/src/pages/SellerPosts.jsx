import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import PostTable from "@/components/posts/PostTable";

export default function SellerPosts() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/posts/my");
      setItems(data.rows || data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return items.filter(p =>
      (status === "all" || p.status === status) &&
      (q.trim() === "" || p.title?.toLowerCase().includes(q.toLowerCase()))
    );
  }, [items, q, status]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Quản lý bài đăng</h1>
        <Link to="/posts/create" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow">
          <Plus className="w-4 h-4" /> Đăng tin mới
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Tìm theo tiêu đề..." className="flex-1 px-3 py-2 border rounded-lg"/>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">Tất cả</option>
          <option value="active">Đang hiển thị</option>
          <option value="hidden">Bị ẩn</option>
          <option value="sold">Đã bán</option>
          <option value="expired">Hết hạn</option>
        </select>
      </div>

      <PostTable loading={loading} items={filtered} onRefresh={fetchData}/>
    </div>
  );
}
