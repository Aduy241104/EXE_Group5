// src/pages/admin/VoucherAssign.jsx
import { useState } from "react";
import { adminAssignVoucher } from "@/services/voucherApi";
import { useParams, useNavigate } from "react-router-dom";

export default function VoucherAssign() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sellerId, setSellerId] = useState("");
  const [count, setCount] = useState(1);

  async function onSubmit(e) {
    e.preventDefault();
    await adminAssignVoucher(id, { seller_id: Number(sellerId), issued_count: Number(count) });
    nav("/admin/vouchers");
  }

  return (
    <form className="p-4 space-y-3" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Gán voucher #{id} cho seller</h1>
      <label className="block space-y-1">
        <span>Seller ID</span>
        <input className="border px-2 py-1 rounded w-64" value={sellerId} onChange={e=>setSellerId(e.target.value)} required />
      </label>
      <label className="block space-y-1">
        <span>Số lượt cấp</span>
        <input type="number" className="border px-2 py-1 rounded w-32" value={count} onChange={e=>setCount(e.target.value)} min={1} />
      </label>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-slate-800 text-white rounded">Lưu</button>
        <button type="button" className="px-4 py-2 border rounded" onClick={()=>history.back()}>Hủy</button>
      </div>
    </form>
  );
}
