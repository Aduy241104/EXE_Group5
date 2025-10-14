import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function PriceRangeCard({ name, currentPrice }) {
  const [range, setRange] = useState(null);

  useEffect(() => {
    if (!name) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/market/price-range`, {
          params: { name, days: 90 },
        });
        setRange(data);
      } catch (e) {
        console.error("price range:", e);
      }
    })();
  }, [name]);

  if (!range) return null;

  const min = Number(range.min || 0);
  const max = Number(range.max || 0);
  const avg = Number(range.avg || 0);
  const pos =
    max > min
      ? ((currentPrice - min) / (max - min)) * 100
      : 50;

  return (
    <div className="bg-white rounded-2xl shadow ring-1 ring-gray-100 p-4">
      <h3 className="font-semibold text-gray-800 mb-3">📊 Khoảng giá thị trường</h3>
      <div className="relative h-2 bg-gray-200 rounded">
        <div
          className="absolute top-0 left-0 h-2 bg-blue-300 rounded"
          style={{ width: `${pos}%` }}
        ></div>
        <div className="absolute top-[-12px] left-[calc(var(--pos)-8px)]"></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{(min / 1e6).toFixed(2)}tr</span>
        <span className="font-semibold text-blue-600">
          {(currentPrice / 1e6).toFixed(1)}tr
        </span>
        <span>{(max / 1e6).toFixed(2)}tr</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Dữ liệu 3 tháng gần nhất • Trung bình: {(avg / 1e6).toFixed(2)}tr
      </p>
    </div>
  );
}
