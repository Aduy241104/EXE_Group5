// src/components/product/SellerCard.jsx
import { useEffect, useState } from "react";
import {
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  Star,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";

const API =
  import.meta.env.VITE_API ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const buildImg = (u) => {
  if (!u) return "/logo.png";
  if (/^https?:\/\//i.test(u)) return u;
  return `${API}/${String(u).replace(/^\/+/, "")}`;
};

export default function SellerCard({ seller, reviewStats }) {
  const [address, setAddress] = useState("Đang tải địa chỉ...");

  useEffect(() => {
    if (!seller?.id) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/users/${seller.id}/addresses`);
        const defaultAddr =
          data.find((a) => a.is_default)?.address_line ||
          data[0]?.address_line ||
          "Địa chỉ chưa cập nhật";
        setAddress(defaultAddr);
      } catch {
        setAddress("Không thể tải địa chỉ");
      }
    })();
  }, [seller?.id]);

  const avg =
    Number((reviewStats && reviewStats.avg) ?? seller?.avg_rating ?? 0);
  const total =
    Number((reviewStats && reviewStats.count) ?? seller?.reviews_count ?? 0);

  return (
    <motion.div
      className="rounded-2xl bg-gradient-to-b from-white via-blue-50/30 to-blue-100/20 ring-1 ring-gray-100 p-5 shadow-sm hover:shadow-md transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <motion.img
          src={buildImg(seller?.avatar_url)}
          alt="Seller Avatar"
          className="h-16 w-16 rounded-full border-2 border-blue-300 object-cover shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-lg font-semibold text-gray-800">
              {seller?.username || "Người bán"}
            </h3>
            {seller?.verified && (
              <ShieldCheck
                className="h-4 w-4 text-emerald-600"
                title="Đã xác minh"
              />
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-blue-500" />
            <span>{seller?.phone || "Chưa có số điện thoại"}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="font-semibold text-gray-800">
              {avg.toFixed(1)}/5
            </span>
          </div>
          <div className="text-[12px] text-gray-500">({total} đánh giá)</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700 mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-blue-500" />
          Phản hồi: <b>{Math.round(Number(seller?.response_rate || 0))}%</b>
        </div>
        <div className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-blue-500" />
          Tốc độ:{" "}
          <b>
            {Math.round((seller?.response_time_sec || 0) / 60) || "<1"} phút
          </b>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 text-gray-700 text-sm">
        <MapPin className="h-4 w-4 text-blue-500 mt-[2px]" />
        <div className="leading-snug">{address}</div>
      </div>
    </motion.div>
  );
}
