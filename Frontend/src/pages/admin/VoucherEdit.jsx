// src/pages/admin/VoucherEdit.jsx
import { useEffect, useState } from "react";
import { adminCreateVoucher, adminUpdateVoucher, adminListVouchers } from "@/services/voucherApi";
import { useParams, useNavigate } from "react-router-dom";

export default function VoucherEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [form, setForm] = useState({
    code: "", name: "", type: "PERCENT", value: 0, free_count: 0,
    max_uses_global: 0, max_uses_per_seller: 1,
    min_fee_amount: 0, applicable_categories: "",
    starts_at: "", ends_at: "", is_active: true, is_global: true,
  });

  useEffect(() => {
    (async () => {
      if (!isNew) {
        // lấy nhanh từ list rồi filter (tránh viết thêm endpoint get-by-id)
        const { items } = await adminListVouchers({ q: "" });
        const row = items.find(x => String(x.id) === String(id));
        if (row) {
          setForm({
            ...form,
            ...row,
            applicable_categories: row.applicable_categories || "",
            starts_at: row.starts_at ? row.starts_at.substring(0,16) : "",
            ends_at: row.ends_at ? row.ends_at.substring(0,16) : "",
          });
        }
      }
    })();
    // eslint-disable-next-line
  }, [id]);

  async function onSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      applicable_categories: form.applicable_categories || null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    };
    if (isNew) await adminCreateVoucher(payload);
    else await adminUpdateVoucher(id, payload);
    navigate("/admin/vouchers");
  }

  return (
    <form className="p-4 space-y-3" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{isNew ? "Tạo Voucher" : "Sửa Voucher"}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span>Code</span>
          <input className="border px-2 py-1 rounded w-full" value={form.code} onChange={e=>setForm({...form, code: e.target.value})} required />
        </label>
        <label className="space-y-1">
          <span>Tên</span>
          <input className="border px-2 py-1 rounded w-full" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required />
        </label>
        <label className="space-y-1">
          <span>Type</span>
          <select className="border px-2 py-1 rounded w-full" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
            <option value="PERCENT">PERCENT</option>
            <option value="AMOUNT">AMOUNT</option>
            <option value="FREE_LISTING">FREE_LISTING</option>
          </select>
        </label>
        <label className="space-y-1">
          <span>Value (%) / Amount (VND)</span>
          <input type="number" className="border px-2 py-1 rounded w-full" value={form.value} onChange={e=>setForm({...form, value: e.target.value})} />
        </label>
        <label className="space-y-1">
          <span>Free Count (FREE_LISTING)</span>
          <input type="number" className="border px-2 py-1 rounded w-full" value={form.free_count} onChange={e=>setForm({...form, free_count: e.target.value})} />
        </label>
        <label className="space-y-1">
          <span>Max uses (global)</span>
          <input type="number" className="border px-2 py-1 rounded w-full" value={form.max_uses_global} onChange={e=>setForm({...form, max_uses_global: e.target.value})} />
        </label>
        <label className="space-y-1">
          <span>Max uses / seller</span>
          <input type="number" className="border px-2 py-1 rounded w-full" value={form.max_uses_per_seller} onChange={e=>setForm({...form, max_uses_per_seller: e.target.value})} />
        </label>
        <label className="space-y-1">
          <span>Min fee amount (VND)</span>
          <input type="number" className="border px-2 py-1 rounded w-full" value={form.min_fee_amount} onChange={e=>setForm({...form, min_fee_amount: e.target.value})} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span>Applicable categories (JSON array id)</span>
          <input className="border px-2 py-1 rounded w-full" placeholder='Ví dụ: ["1","2"]'
            value={form.applicable_categories || ""} onChange={e=>setForm({...form, applicable_categories: e.target.value})} />
        </label>
        <label className="space-y-1">
          <span>Starts at</span>
          <input type="datetime-local" className="border px-2 py-1 rounded w-full" value={form.starts_at} onChange={e=>setForm({...form, starts_at: e.target.value})} />
        </label>
        <label className="space-y-1">
          <span>Ends at</span>
          <input type="datetime-local" className="border px-2 py-1 rounded w-full" value={form.ends_at} onChange={e=>setForm({...form, ends_at: e.target.value})} />
        </label>
        <label className="space-y-1">
          <span>Active</span>
          <select className="border px-2 py-1 rounded w-full" value={String(form.is_active)} onChange={e=>setForm({...form, is_active: e.target.value==="true"})}>
            <option value="true">true</option><option value="false">false</option>
          </select>
        </label>
        <label className="space-y-1">
          <span>Global</span>
          <select className="border px-2 py-1 rounded w-full" value={String(form.is_global)} onChange={e=>setForm({...form, is_global: e.target.value==="true"})}>
            <option value="true">true</option><option value="false">false</option>
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-slate-800 text-white rounded">Lưu</button>
        <button type="button" className="px-4 py-2 border rounded" onClick={()=>history.back()}>Hủy</button>
      </div>
    </form>
  );
}
