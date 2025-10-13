// src/pages/admin/VoucherRedemptions.jsx
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useParams } from "react-router-dom";

export default function VoucherRedemptions() {
  const { id } = useParams();
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/api/vouchers/${id}/redemptions`);
      setItems(data.items || []);
    })();
  }, [id]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Lịch sử sử dụng voucher #{id}</h1>
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left p-2">Thời gian</th>
            <th className="text-left p-2">Seller</th>
            <th className="text-left p-2">Post</th>
            <th className="text-left p-2">Before</th>
            <th className="text-left p-2">Discount</th>
            <th className="text-left p-2">After</th>
          </tr>
        </thead>
        <tbody>
          {items.map(x => (
            <tr key={x.id} className="border-b">
              <td className="p-2">{new Date(x.created_at).toLocaleString()}</td>
              <td className="p-2">{x.seller_name} (#{x.seller_id})</td>
              <td className="p-2">{x.post_name} (#{x.post_id})</td>
              <td className="p-2">{Number(x.fee_before).toLocaleString("vi-VN")}đ</td>
              <td className="p-2">{Number(x.discount_applied).toLocaleString("vi-VN")}đ</td>
              <td className="p-2 font-semibold">{Number(x.fee_after).toLocaleString("vi-VN")}đ</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
