// src/pages/admin/VoucherList.jsx
import { useEffect, useState } from "react";
import { adminListVouchers, adminDeleteVoucher } from "@/services/voucherApi";
import { Link } from "react-router-dom";

export default function VoucherList() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { items } = await adminListVouchers({ q });
      setItems(items || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <input className="border px-2 py-1 rounded w-64" placeholder="Tìm theo code/tên..." value={q} onChange={e=>setQ(e.target.value)} />
        <button className="px-3 py-1 bg-slate-800 text-white rounded" onClick={load}>Tìm</button>
        <Link to="/admin/vouchers/new" className="ml-auto px-3 py-1 bg-green-600 text-white rounded">+ Tạo voucher</Link>
      </div>
      {loading ? "Đang tải..." : (
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Code</th>
              <th className="text-left p-2">Tên</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Giá trị</th>
              <th className="text-left p-2">Trạng thái</th>
              <th className="text-left p-2">#</th>
            </tr>
          </thead>
          <tbody>
            {items.map(v => (
              <tr key={v.id} className="border-b">
                <td className="p-2">{v.id}</td>
                <td className="p-2 font-mono">{v.code}</td>
                <td className="p-2">{v.name}</td>
                <td className="p-2">{v.type}</td>
                <td className="p-2">
                  {v.type === "PERCENT" ? `${v.value}%` :
                   v.type === "AMOUNT" ? `${Number(v.value||0).toLocaleString("vi-VN")}đ` :
                   `FREE x${v.free_count}`}
                </td>
                <td className="p-2">{v.is_active ? "Active" : "Inactive"}</td>
                <td className="p-2 flex gap-2">
                  <Link to={`/admin/vouchers/${v.id}/edit`} className="px-2 py-1 border rounded">Sửa</Link>
                  <Link to={`/admin/vouchers/${v.id}/assign`} className="px-2 py-1 border rounded">Gán</Link>
                  <Link to={`/admin/vouchers/${v.id}/redemptions`} className="px-2 py-1 border rounded">Log</Link>
                  <button
                    className="px-2 py-1 border border-red-600 text-red-600 rounded"
                    onClick={async ()=>{
                      if (!confirm("Vô hiệu voucher này?")) return;
                      await adminDeleteVoucher(v.id);
                      await load();
                    }}
                  >Vô hiệu</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
