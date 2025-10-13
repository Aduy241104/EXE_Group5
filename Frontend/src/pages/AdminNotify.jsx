import api from "@/lib/api";
// src/pages/AdminNotify.jsx
import { useContext, useEffect, useMemo, useState } from "react";

import { AuthContext } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Send, Users, UserPlus, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminNotify() {
  const { user, token } = useContext(AuthContext);
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState("all"); // all | single | multiple

  // search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [picking, setPicking] = useState(false);

  // recipients
  const [single, setSingle] = useState(null);
  const [multi, setMulti] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const tokenHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setPicking(true);
        const res = await api.get(`${API}/api/users/search`, {
          ...tokenHeader,
          params: { q: query.trim() },
        });
        setResults(res.data || []);
      } catch {
        setResults([]);
      } finally {
        setPicking(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, tokenHeader]);

  const addRecipient = (u) => {
    if (mode === "single") {
      setSingle(u);
    } else if (mode === "multiple") {
      setMulti((prev) =>
        prev.find((x) => x.id === u.id) ? prev : [...prev, u]
      );
    }
    setQuery("");
    setResults([]);
  };

  const removeRecipient = (id) => {
    setMulti((prev) => prev.filter((u) => u.id !== id));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);

      // payload theo mode
      let payload = { title: title.trim(), body: body.trim() };
      if (mode === "single" && single?.id) {
        payload.user_id = single.id;
      }
      if (mode === "multiple" && multi.length > 0) {
        payload.user_ids = multi.map((u) => u.id);
      }
      // "all" => không truyền user_id(s) => broadcast

      await api.post(`${API}/api/notifications`, payload, tokenHeader);

      // reset form
      setTitle("");
      setBody("");
      setSingle(null);
      setMulti([]);
      setMode("all");
      alert("Đã gửi thông báo!");
    } catch (err) {
      console.error(err);
      alert("Gửi thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-orange-600 mb-6 flex items-center gap-2">
        <Send className="w-6 h-6" /> Gửi thông báo
      </h1>

      <form
        onSubmit={submit}
        className="bg-white rounded-xl shadow p-6 max-w-3xl space-y-4"
      >
        {/* Chế độ gửi */}
        <div className="flex flex-wrap gap-3">
          <label className={`px-3 py-2 rounded-lg cursor-pointer border ${mode==="all"?"bg-orange-50 border-orange-300 text-orange-700":"border-gray-300"}`}>
            <input
              type="radio"
              name="mode"
              className="mr-2"
              checked={mode === "all"}
              onChange={() => setMode("all")}
            />
            <span className="inline-flex items-center gap-1">
              <Users className="w-4 h-4" /> Tất cả người dùng
            </span>
          </label>
          <label className={`px-3 py-2 rounded-lg cursor-pointer border ${mode==="single"?"bg-orange-50 border-orange-300 text-orange-700":"border-gray-300"}`}>
            <input
              type="radio"
              name="mode"
              className="mr-2"
              checked={mode === "single"}
              onChange={() => { setMode("single"); setMulti([]); }}
            />
            <span className="inline-flex items-center gap-1">
              <UserPlus className="w-4 h-4" /> Một người
            </span>
          </label>
          <label className={`px-3 py-2 rounded-lg cursor-pointer border ${mode==="multiple"?"bg-orange-50 border-orange-300 text-orange-700":"border-gray-300"}`}>
            <input
              type="radio"
              name="mode"
              className="mr-2"
              checked={mode === "multiple"}
              onChange={() => { setMode("multiple"); setSingle(null); }}
            />
            <span className="inline-flex items-center gap-1">
              <Users className="w-4 h-4" /> Nhiều người
            </span>
          </label>
        </div>

        {/* Tìm & chọn người nhận (single / multiple) */}
        {(mode === "single" || mode === "multiple") && (
          <div>
            <label className="block font-medium mb-1">Tìm người dùng</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập email hoặc username…"
              className="w-full border rounded px-3 py-2"
            />
            {/* Gợi ý */}
            {query && (
              <div className="mt-2 border rounded-lg bg-white shadow divide-y max-h-60 overflow-y-auto">
                {picking ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Đang tìm…</div>
                ) : results.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Không có kết quả.
                  </div>
                ) : (
                  results.map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={() => addRecipient(u)}
                    >
                      <div className="font-medium">{u.username || "(chưa đặt tên)"}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Hiển thị người nhận đã chọn */}
            {mode === "single" && single && (
              <div className="mt-2 inline-flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1 rounded-full">
                <span className="font-medium">{single.username || single.email}</span>
                <button type="button" onClick={() => setSingle(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {mode === "multiple" && multi.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {multi.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1 rounded-full"
                  >
                    <span className="font-medium">{u.username || u.email}</span>
                    <button type="button" onClick={() => removeRecipient(u.id)}>
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nội dung */}
        <div>
          <label className="block font-medium mb-1">Tiêu đề *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Ví dụ: Bảo trì hệ thống 23:00 tối nay"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Nội dung</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="Chi tiết (tuỳ chọn)"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-orange-600 text-white font-semibold px-5 py-2 rounded hover:bg-orange-700 disabled:opacity-60"
          >
            {submitting ? "Đang gửi..." : "Gửi thông báo"}
          </button>
        </div>
      </form>
    </div>
  );
}
