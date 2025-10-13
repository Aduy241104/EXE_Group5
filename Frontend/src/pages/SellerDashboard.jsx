// src/pages/SellerDashboard.jsx
import api from "@/lib/api";
import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { RotateCw, ClipboardList, Megaphone, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const fmtVND = (v)=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(Number(v||0));
const STATUS_ORDER=["pending","confirmed","shipped","completed","canceled"];
const STATUS_VI={pending:"Chờ xác nhận",confirmed:"Đã xác nhận",shipped:"Đang giao",completed:"Hoàn tất",canceled:"Đã hủy"};

export default function SellerDashboard() {
  const { user } = useContext(AuthContext);
  const [stats,setStats]=useState({ total_revenue:0, status_counts:[] });
  const [myPostsCount,setMyPostsCount]=useState(0);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);

  const fetchStats = useCallback(async ()=>{
    try {
      setRefreshing(true);
      const [s,p]=await Promise.all([
        api.get("/api/orders/stats"),
        api.get("/api/products/myposts/count"),
      ]);
      setStats(s.data || { total_revenue:0, status_counts:[] });
      setMyPostsCount(p.data?.count || 0);
    } finally { setLoading(false); setRefreshing(false); }
  },[]);

  useEffect(()=>{ fetchStats(); },[fetchStats]);
  useEffect(()=>{ const h=()=>fetchStats(); window.addEventListener("order-status-updated",h); return ()=>window.removeEventListener("order-status-updated",h);},[fetchStats]);

  const normalizedStatus = useMemo(()=>{
    const map=new Map(stats.status_counts?.map(s=>[s.status,Number(s.count||0)]));
    return STATUS_ORDER.map(k=>({status:k,label:STATUS_VI[k],count:map.get(k)||0}));
  },[stats]);

  const totalOrders = useMemo(()=>normalizedStatus.reduce((s,x)=>s+x.count,0),[normalizedStatus]);
  const pendingCount = normalizedStatus.find(s=>s.status==="pending")?.count || 0;

  if (!user) return <p className="text-center py-10 text-gray-600">Bạn cần đăng nhập để xem thống kê.</p>;

  return (
    <div className="container mx-auto px-6 py-10">
      {loading ? (
        <p className="text-center text-gray-500 py-10">⏳ Đang tải dữ liệu...</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-orange-600">📊 Bảng điều khiển bán hàng</h1>
            <div className="flex items-center gap-3">
              <button onClick={fetchStats} disabled={refreshing}
                className="flex items-center gap-2 bg-white border px-3 py-2 rounded hover:bg-gray-50">
                <RotateCw className={`w-4 h-4 ${refreshing?"animate-spin":""}`} />
                {refreshing ? "Đang làm mới..." : "Làm mới"}
              </button>
              <Link to="/post/create" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                + Đăng tin mới
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm font-medium text-gray-500">Tổng doanh thu</h2>
              <p className="text-3xl mt-2 font-bold text-green-600">{fmtVND(stats.total_revenue)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm font-medium text-gray-500">Tổng số đơn</h2>
              <p className="text-3xl mt-2 font-bold text-indigo-600">{totalOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm font-medium text-gray-500">Đơn chờ xác nhận</h2>
              <p className="text-3xl mt-2 font-bold text-amber-600">{pendingCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Đơn theo trạng thái</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {normalizedStatus.map(s=>(
                <div key={s.status} className="border rounded-lg p-4 text-center hover:shadow-sm transition">
                  <p className="font-medium">{s.label}</p>
                  <p className="text-2xl mt-1">{s.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div whileHover={{ y:-3, boxShadow:"0 10px 25px rgba(0,0,0,0.08)" }}
              className="relative bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
              <div className="absolute top-3 right-3 flex gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs bg-white border text-gray-700">Tổng: <b>{totalOrders}</b></span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">Chờ: <b>{pendingCount}</b></span>
              </div>
              <Link to="/seller/orders" className="group block p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-orange-500 text-white"><ClipboardList className="w-6 h-6"/></div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">Quản lý đơn bán</h3>
                    <p className="text-gray-600 mb-3">Xem & cập nhật trạng thái đơn hàng.</p>
                    <div className="inline-flex items-center gap-1 text-orange-600 font-medium">
                      Vào quản lý <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y:-3, boxShadow:"0 10px 25px rgba(0,0,0,0.08)" }}
              className="relative bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-cyan-100">
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 rounded-full text-xs bg-white border text-gray-700">{myPostsCount} tin</span>
              </div>
              <Link to="/myposts" className="group block p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-600 text-white"><Megaphone className="w-6 h-6"/></div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">Tin đã đăng</h3>
                    <p className="text-gray-600 mb-3">Chỉnh sửa / Xóa các tin hiện tại.</p>
                    <div className="inline-flex items-center gap-1 text-cyan-700 font-medium">
                      Xem danh sách <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
