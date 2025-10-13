// src/pages/seller/VouchersPage.jsx
import { useMyVouchers } from "@/hooks/useVouchers";

const pill = (txt) => (
  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">{txt}</span>
);

export default function VouchersPage() {
  const { items, loading, err } = useMyVouchers();

  if (loading) return <div className="p-4">Đang tải...</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Voucher khả dụng của tôi</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">Code</th>
              <th className="text-left p-2">Tên</th>
              <th className="text-left p-2">Loại</th>
              <th className="text-left p-2">Giá trị</th>
              <th className="text-left p-2">Hiệu lực</th>
              <th className="text-left p-2">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {items.map(v => (
              <tr key={v.id} className="border-b">
                <td className="p-2 font-mono">{v.code}</td>
                <td className="p-2">{v.name}</td>
                <td className="p-2">{pill(v.type)}</td>
                <td className="p-2">
                  {v.type === "PERCENT" ? `${v.value}%` :
                   v.type === "AMOUNT" ? `${Number(v.value||0).toLocaleString("vi-VN")}đ` :
                   v.type === "FREE_LISTING" ? `Miễn phí ${v.free_count} lần` : "-"}
                </td>
                <td className="p-2">
                  {(v.starts_at ? new Date(v.starts_at).toLocaleDateString() : "—") + " → " + (v.ends_at ? new Date(v.ends_at).toLocaleDateString() : "—")}
                </td>
                <td className="p-2">{v.is_global ? pill("Global") : pill("Assigned")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
