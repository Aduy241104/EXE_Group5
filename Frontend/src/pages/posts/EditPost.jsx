// src/components/product/ProductDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import {
  Loader2,
  MessageCircle,
  ShoppingCart,
  User,
  Star,
  Image as ImageIcon,
} from "lucide-react";
import SellerCard from "./SellerCard";

/* =======================
   🔧 Utils
======================= */
const API =
  import.meta.env.VITE_API ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const buildImg = (u) => {
  if (!u) return "/logo.png";
  if (/^https?:\/\//i.test(u)) return u;
  return `${API}/${String(u).replace(/^\/+/, "")}`;
};

const Badge = ({ children, color }) => (
  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
    {children}
  </span>
);

function StatusBadge({ status, inStock }) {
  if (inStock === false)
    return <Badge color="bg-gray-200 text-gray-700">Hết hàng</Badge>;
  const map = {
    active: "bg-green-100 text-green-700",
    sold: "bg-blue-100 text-blue-700",
    expired: "bg-amber-100 text-amber-700",
    hidden: "bg-gray-100 text-gray-700",
  };
  return (
    <Badge color={map[status] || "bg-gray-100 text-gray-700"}>
      {status || "active"}
    </Badge>
  );
}

/* =======================
   🧠 Helper
======================= */
function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " đ";
}

/* =======================
   🏆 Main Component
======================= */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/products/${id}`);
        setProduct(data);
        if (data?.seller_id || data?.user_id) {
          const sid = data.seller_id ?? data.user_id;
          const sellerRes = await api
            .get(`/api/sellers/${sid}/metrics`)
            .catch(() => ({ data: null }));
          setSeller(sellerRes.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const inStock = product?.quantity > 0 || product?.is_available === true;

  const createOrder = async () => {
    try {
      const { data } = await api.post("/api/orders", {
        product_id: Number(id),
        quantity: 1,
      });
      if (data?.order?.id) navigate(`/orders/buyer?highlight=${data.order.id}`);
    } catch (e) {
      alert(e?.response?.data?.message || "Không thể tạo đơn hàng");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang tải sản phẩm...
      </div>
    );

  if (!product)
    return (
      <div className="text-center text-red-600 mt-10">
        Không tìm thấy sản phẩm.
      </div>
    );

  const specs = product.specs && typeof product.specs === "object"
    ? Object.entries(product.specs)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between mb-6 gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold text-gray-800">
            {product.name}
          </h1>
          <StatusBadge status={product.status} inStock={inStock} />
        </div>
        <div className="text-3xl font-extrabold text-orange-600">
          {fmtVND(product.price)}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT */}
        <div>
          <img
            src={buildImg(product.image_url)}
            alt={product.name}
            className="w-full max-h-[480px] object-cover rounded-2xl border border-amber-200 shadow-md"
            onError={(e) => (e.currentTarget.src = "/logo.png")}
          />

          {/* ✅ Chi tiết sản phẩm */}
          <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-lg font-semibold text-gray-800 mb-2">
              Chi tiết sản phẩm
            </div>

            {specs.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                {specs.map(([key, value]) => (
                  <Fragment key={key}>
                    <div className="text-gray-500 capitalize">
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="font-medium">{String(value)}</div>
                  </Fragment>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Không có chi tiết sản phẩm.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4">
          {/* Mô tả chi tiết */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="font-semibold mb-2 text-gray-800 text-lg">
              Mô tả chi tiết
            </div>
            <p className="text-gray-700 whitespace-pre-line bg-gray-50/60 p-3 rounded-xl shadow-inner">
              {product.description || "Không có mô tả."}
            </p>
          </div>

          {/* Seller */}
          {seller && <SellerCard seller={seller} />}
          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-3">
<button
  onClick={createOrder}
  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow hover:bg-blue-700 active:scale-[0.98] transition"
>
  <ShoppingCart className="h-5 w-5" /> Tạo yêu cầu mua
</button>


            <Link
              to="/messages"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2 rounded-xl border border-orange-400 text-orange-600 hover:bg-orange-50 transition"
            >
              <MessageCircle className="h-5 w-5" /> Nhắn tin
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
