import { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "@/context/AuthContext";
import api from "@/lib/api";
import { Star, Loader2 } from "lucide-react";

function computeSummary(list) {
  const count = list.length;
  const hist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of list) {
    const rate = Number(r.rating) || 0;
    hist[rate] = (hist[rate] || 0) + 1;
    sum += rate;
  }
  return { avg: count ? sum / count : 0, count, hist };
}

function RatingSummary({ summary }) {
  const avg = summary?.avg || 0;
  const count = summary?.count || 0;
  const percent = (k) => (count ? Math.round((summary.hist[k] / count) * 100) : 0);
  return (
    <div className="rounded-2xl bg-blue-50 p-5 text-center">
      <div className="text-4xl font-bold text-blue-600">{avg.toFixed(1)}</div>
      <div className="flex justify-center gap-1 my-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
      <p className="text-gray-500 text-sm mb-3">{count} lượt đánh giá</p>
      {[5, 4, 3, 2, 1].map((k) => (
        <div key={k} className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-6">{k}★</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2 bg-blue-500" style={{ width: `${percent(k)}%` }} />
          </div>
          <span className="w-8 text-right">{percent(k)}%</span>
        </div>
      ))}
    </div>
  );
}

function ReviewItem({ r }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition"
    >
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span className="font-semibold text-gray-800">{r.product_name}</span>
        <span>{new Date(r.created_at).toLocaleDateString("vi-VN")}</span>
      </div>
      <div className="flex mb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
      <p className="text-gray-700 text-sm leading-relaxed">{r.content}</p>
      {Array.isArray(r.images) && r.images.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {r.images.map((u, i) => (
            <img
              key={i}
              src={/^https?:/.test(u) ? u : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${u}`}
              alt=""
              className="h-16 w-16 rounded-lg object-cover border"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function ProfileReviews() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ avg: 0, count: 0, hist: {} });

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/users/${user.id}/reviews`);
        const list = Array.isArray(data?.items) ? data.items : data;
        setReviews(list);
        setSummary(computeSummary(list));
      } catch (err) {
        console.error("Load user reviews error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Đang tải đánh giá...
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Đánh giá của tôi</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <RatingSummary summary={summary} />
        </div>
        <div className="md:col-span-2 space-y-3">
          {reviews.length ? (
            reviews.map((r) => <ReviewItem key={r.id} r={r} />)
          ) : (
            <p className="text-gray-500 text-center py-10">Bạn chưa viết đánh giá nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}
