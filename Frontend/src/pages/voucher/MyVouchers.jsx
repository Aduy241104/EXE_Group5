import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function MyVouchers() {
  const [data, setData] = useState([]);
  useEffect(()=>{ api.get("/api/vouchers/mine").then(({data})=>setData(data)); },[]);
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Voucher của tôi</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {data.map(v=>(
          <div key={v.id} className="p-4 rounded-xl border bg-gradient-to-br from-amber-50 to-yellow-50">
            <div className="text-lg font-semibold">{v.code}</div>
            <div className="text-sm text-gray-600">{v.description}</div>
            <div className="text-sm mt-2">Loại: {v.type} • Giá trị: {v.value}{v.type==='percent'?'%':'đ'}</div>
            <div className="text-xs text-gray-500 mt-1">HSD: {v.expires_at ? new Date(v.expires_at).toLocaleDateString() : 'Không'}</div>
            <div className="text-xs mt-2">Đã dùng: {v.used_count}/{v.max_uses || '∞'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
