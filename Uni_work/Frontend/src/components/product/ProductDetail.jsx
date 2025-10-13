import api from '../../lib/api';
import { useEffect, useState, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ===== Helpers an toàn số =====
const num = (v, def = 0) => {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : def;
};
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const stars = (x) => {
  const r = Math.round(clamp(num(x), 0, 5));
  return "★".repeat(r) + "☆".repeat(5 - r);
};
const fmt1 = (x) => num(x).toFixed(1);
const fmtVND = (x) => new Intl.NumberFormat("vi-VN").format(num(x)) + " đ";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [sellerProfile, setSellerProfile] = useState(null);
  const [sellerBadges, setSellerBadges] = useState([]);

  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewFiles, setReviewFiles] = useState([]); // ảnh chọn để upload

  // Tính sao TB & breakdown 1..5 từ danh sách reviews (FE-side)
  const ratingSummary = useMemo(() => {
    const total = reviews.length || 0;
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of reviews) {
      const v = clamp(num(r?.rating, 0), 1, 5);
      counts[v] = (counts[v] || 0) + 1;
      sum += v;
    }
    const avg = total ? sum / total : 0;
    return { total, counts, avg };
  }, [reviews]);

  // Giá trị hiển thị an toàn
  const avgDisplay = useMemo(() => {
    return num(product?.rating_avg ?? ratingSummary.avg, 0);
  }, [product?.rating_avg, ratingSummary.avg]);

  const countDisplay = useMemo(() => {
    return num(product?.rating_count ?? ratingSummary.total, 0);
  }, [product?.rating_count, ratingSummary.total]);

  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const canDelete =
    isAdmin ||
    (product?.seller_id && user?.id && Number(product.seller_id) === Number(user.id));

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`${API}/api/products/${id}`);
        setProduct(res.data);

        if (res.data?.seller_id) {
          try {
            const pr = await api.get(
              `${API}/api/profile/${res.data.seller_id}/public`
            );
            setSellerProfile(pr.data?.profile || null);
            setSellerBadges(pr.data?.badges || []);
          } catch {}
        }

        const rv = await api.get(`${API}/api/products/${id}/reviews`);
        setReviews(Array.isArray(rv.data) ? rv.data : []);
      } catch (err) {
        console.error("❌ Lỗi khi load chi tiết sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleOrder = async () => {
    if (!user) {
      toast.error("⚠️ Vui lòng đăng nhập để tạo yêu cầu mua.");
      return;
    }
    if (!product) return;

    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("Số lượng không hợp lệ.");
      return;
    }

    if (product.seller_id && Number(product.seller_id) === Number(user.id)) {
      toast("Bạn không thể mua sản phẩm của chính mình.");
      return;
    }

    try {
      await api.post(
        `${API}/api/orders`,
        { product_id: product.id, quantity: qty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("🎉 Đã tạo yêu cầu mua!");
      navigate("/orders/buyer");
    } catch (err) {
      console.error("❌ Lỗi khi tạo đơn:", err);
      toast.error("Không thể tạo yêu cầu mua.");
    }
  };

  // 🗑️ XÓA sản phẩm (admin hoặc chủ sở hữu)
  const handleDeleteProduct = async () => {
    if (!canDelete) return;
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này? Hành động không thể hoàn tác.")) return;
    try {
      await api.delete(`${API}/api/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa sản phẩm.");
      navigate("/products");
    } catch (err) {
      console.error("❌ Lỗi xóa sản phẩm:", err);
      toast.error(err?.response?.data?.error || "Không thể xóa sản phẩm.");
    }
  };

  // Gửi review kèm ảnh (multipart)
  const submitReview = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đánh giá.");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("rating", String(newRating));
      fd.append("content", newComment);
      reviewFiles.forEach((file) => fd.append("images", file));

      await api.post(`${API}/api/products/${id}/reviews`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Cảm ơn bạn đã đánh giá!");
      setNewComment("");
      setNewRating(5);
      setReviewFiles([]);

      const rv = await api.get(`${API}/api/products/${id}/reviews`);
      setReviews(Array.isArray(rv.data) ? rv.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể gửi đánh giá.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center py-10">Đang tải...</p>;
  if (!product) return <p className="text-center py-10">Không tìm thấy sản phẩm.</p>;

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex justify-center">
          <img
            src={product.image_url || "https://placehold.co/500x500?text=UniTrade"}
            alt={product.name}
            className="rounded-lg shadow-lg max-h-[500px] object-cover"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-1">{product.name}</h1>

          {/* ⭐ Sao trung bình của sản phẩm */}
          <div className="flex items-center gap-3 mb-3">
            <div className="text-yellow-500 text-xl">{stars(avgDisplay)}</div>
            <div className="text-sm text-gray-600">
              {fmt1(avgDisplay)} / 5 • {countDisplay} đánh giá
            </div>
          </div>

          <p className="text-orange-600 text-2xl font-semibold mb-4">
            {fmtVND(product.price)}
          </p>
          <p className="text-gray-700 mb-6">{product.description}</p>

          <div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
            <h2 className="font-semibold text-lg mb-2">Thông tin người bán</h2>
            <p>
              <span className="font-medium">Tên:</span> {product.seller_name}
            </p>
            {product.seller_phone && (
              <p>
                <span className="font-medium">SĐT:</span> {product.seller_phone}
              </p>
            )}

            {sellerBadges.length > 0 && (
              <div className="mt-3">
                <div className="text-sm text-gray-600 mb-1">Huy hiệu:</div>
                <div className="flex flex-wrap gap-2">
                  {sellerBadges.map((b) => (
                    <span
                      key={b.code}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border text-xs"
                    >
                      <span>🏅</span>
                      <span className="font-medium">{b.title}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sellerProfile && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  ⭐ Đánh giá TB: <b>{fmt1(sellerProfile.rating_avg_overall)}</b> (
                  {num(sellerProfile.rating_count_overall)}
                  )
                </div>
                <div>🛒 Đã bán: <b>{num(sellerProfile.total_sold)}</b></div>
                <div>⚡ Tỉ lệ phản hồi: <b>{num(sellerProfile.response_rate)}%</b></div>
                <div>⏱️ Phản hồi TB: <b>{num(sellerProfile.response_avg_minutes)}′</b></div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {product.seller_phone && (
              <a
                href={`tel:${product.seller_phone}`}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
              >
                📞 Gọi ngay
              </a>
            )}

            <button
              className="bg-yellow-400 text-white px-6 py-2 rounded-lg hover:bg-yellow-500 transition"
              onClick={() =>
                navigate("/messages", {
                  state: {
                    sellerId: product.seller_id,
                    sellerName: product.seller_name,
                  },
                })
              }
            >
              💬 Nhắn tin
            </button>

            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 border rounded px-2 py-1"
              />
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={handleOrder}
              >
                📝 Tạo yêu cầu mua
              </button>
            </div>

            {/* 🗑️ Nút xóa cho admin hoặc chủ sở hữu */}
            {canDelete && (
              <button
                onClick={handleDeleteProduct}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 md:ml-2"
                title={isAdmin ? "Xóa (admin)" : "Xóa sản phẩm của tôi"}
              >
                🗑️ Xóa sản phẩm
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===================== REVIEW & RATING ===================== */}
      <div className="mt-10 border-t pt-8">
        <h2 className="text-xl font-bold mb-4">Đánh giá & nhận xét</h2>

        {/* Tổng quan + biểu đồ tỉ lệ */}
        <div className="bg-white p-5 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-orange-500">
                {fmt1(avgDisplay)}
              </div>
              <div className="flex flex-col">
                <div className="text-yellow-500 text-lg">{stars(avgDisplay)}</div>
                <div className="text-sm text-gray-600">
                  {countDisplay} lượt đánh giá
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-0 w-full md:w-1/2">
              {[5, 4, 3, 2, 1].map((r) => {
                const total = ratingSummary.total;
                const count = ratingSummary.counts[r] || 0;
                const percent = total ? (count / total) * 100 : 0;
                return (
                  <div
                    key={r}
                    className="flex items-center gap-3 text-sm text-gray-700 mb-1"
                  >
                    <span className="w-8 text-right">{r}★</span>
                    <div className="flex-1 bg-gray-200 h-2 rounded">
                      <div
                        className="bg-yellow-400 h-2 rounded"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-gray-500">
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form gửi review */}
        <div className="bg-gray-50 p-4 rounded-lg shadow mb-6">
          <h3 className="font-semibold mb-2">Viết đánh giá của bạn</h3>
          <div className="flex items-center mb-2 gap-2">
            <span>Chấm điểm:</span>
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => setNewRating(r)}
                className={`text-2xl ${
                  r <= newRating ? "text-yellow-500" : "text-gray-400"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          {/* Chọn ảnh (preview) */}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setReviewFiles(Array.from(e.target.files || []))}
            className="mb-3"
          />
          {reviewFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {reviewFiles.map((f, i) => (
                <div key={i} className="relative">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={`preview-${i}`}
                    className="w-16 h-16 object-cover rounded border"
                  />
                </div>
              ))}
            </div>
          )}

          <textarea
            className="w-full border rounded px-3 py-2 mb-3"
            placeholder="Chia sẻ cảm nhận của bạn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            onClick={submitReview}
            disabled={submitting}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>

        {/* Danh sách review */}
        {reviews.length === 0 ? (
          <p className="text-gray-500 italic">Chưa có đánh giá nào.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((rv) => {
              const r = clamp(num(rv?.rating, 0), 1, 5);
              const imgs =
                Array.isArray(rv?.images)
                  ? rv.images
                  : typeof rv?.images === "string"
                  ? (() => {
                      try {
                        const j = JSON.parse(rv.images);
                        return Array.isArray(j) ? j : [];
                      } catch {
                        return [];
                      }
                    })()
                  : [];
              return (
                <div key={rv.id} className="border p-4 rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-sm text-gray-700">
                      {rv.username || "Người dùng ẩn danh"}
                    </div>
                    <div className="text-yellow-500 text-sm">
                      {"★".repeat(r)}
                      {"☆".repeat(5 - r)}
                    </div>
                  </div>

                  <p className="mt-1 text-gray-700">{rv.content}</p>

                  {imgs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {imgs.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer" title="Xem ảnh">
                          <img
                            src={img}
                            alt={`review-${idx}`}
                            className="w-20 h-20 object-cover rounded border"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-1">
                    {rv.created_at
                      ? new Date(rv.created_at).toLocaleString("vi-VN")
                      : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
