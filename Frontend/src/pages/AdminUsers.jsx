// src/pages/AdminUsers.jsx
import api from "@/lib/api";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  ShieldCheck,
  BadgeCheck,
  Store,
  UserRound,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const RoleBadge = ({ role }) => {
  const r = (role || "").toLowerCase();
  if (r === "admin")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
        <BadgeCheck className="w-3.5 h-3.5" /> Admin
      </span>
    );
  if (r === "seller")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-orange-50 text-orange-700 border border-orange-100">
        <Store className="w-3.5 h-3.5" /> Người bán
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-sky-50 text-sky-700 border border-sky-100">
      <UserRound className="w-3.5 h-3.5" /> Người mua
    </span>
  );
};

export default function AdminUsers() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // chỉ cho admin
  useEffect(() => {
    if (!user) return;
    if ((user.role || "").toLowerCase() !== "admin") navigate("/");
  }, [user, navigate]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      // ✅ đúng prefix: /api/users/admin/users
      const res = await api.get("/api/users/admin/users", {
        params: { query: debounced, page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error("❌ admin users list:", e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, page, limit, token]);

  const updateRole = async (id, role) => {
    try {
      await api.put(
        `/api/users/admin/users/${id}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (e) {
      console.error("❌ update role:", e?.message);
    }
  };

  const toggleActive = async (id, active) => {
    try {
      await api.put(
        `/api/users/admin/users/${id}/active`,
        { active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (e) {
      console.error("❌ toggle active:", e?.message);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
            Quản trị người dùng
          </h1>
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên, email, số điện thoại…"
            className="w-full rounded-lg border-gray-200 pl-10 pr-3 py-2 focus:border-indigo-400 focus:ring-indigo-400"
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <table className="min-w-[860px] w-full">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Người dùng</th>
              <th className="text-left px-4 py-3">Liên hệ</th>
              <th className="text-left px-4 py-3">Trường / MSSV</th>
              <th className="text-left px-4 py-3">Vai trò</th>
              <th className="text-left px-4 py-3">Trạng thái</th>
              <th className="text-right px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const isSelf = u.id === user?.id;
                return (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{u.username || "—"}</div>
                      <div className="text-xs text-gray-500">ID: {u.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">{u.email}</div>
                      <div className="text-xs text-gray-500">{u.phone || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">{u.school || "—"}</div>
                      <div className="text-xs text-gray-500">{u.student_id || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={u.role} />
                        <select
                          disabled={isSelf}
                          value={u.role || "buyer"}
                          onChange={(e) => updateRole(u.id, e.target.value)}
                          className={`rounded-md border-gray-200 text-sm ${
                            isSelf ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                        >
                          <option value="buyer">Người mua</option>
                          <option value="seller">Người bán</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      {isSelf && (
                        <div className="text-[11px] text-gray-400 mt-1">
                          (Không thể đổi vai trò chính mình ở đây)
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-xs">
                          <ToggleRight className="w-3.5 h-3.5" /> Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-xs">
                          <ToggleLeft className="w-3.5 h-3.5" /> Bị khóa
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(u.id, !u.active)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border ${
                          u.active
                            ? "border-gray-200 hover:bg-gray-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {u.active ? "Khóa" : "Mở khóa"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-600 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Tổng: <b>{total}</b> người dùng
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 border rounded disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Trang <b>{page}</b> / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-1 border rounded disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
