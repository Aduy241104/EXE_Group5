import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/logo.png";

const isAbs = (u) => /^https?:\/\//i.test(u || "");
export const imageSrc = (p) => {
  const raw =
    p?.image_url ??
    p?.image ??
    p?.thumbnail ??
    p?.images?.[0]?.url ??
    p?.images?.[0]?.src ??
    p?.images?.[0]?.filename ??
    "";

  if (!raw) return PLACEHOLDER;

  // ✅ chuẩn hoá backslash -> slash để khớp mọi DB/OS
  const s0 = String(raw).replace(/\\/g, "/");

  if (isAbs(s0)) return s0;
  if (s0.startsWith("/uploads/")) return `${API}${s0}`;
  if (s0.startsWith("uploads/")) return `${API}/${s0}`;
  return `${API}/uploads/${s0}`;
};

const money = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(n || 0));

export default function ProductCard({
  product,
  onToggleFavorite,
  ownerView = false,
  onDeleted,
  onUpdated,
}) {
  const img = imageSrc(product);

  const handleError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = PLACEHOLDER;
  };

  return (
    <article className="group relative bg-white rounded-2xl shadow hover:shadow-md ring-1 ring-gray-100 overflow-hidden">
      <Link to={`/products/${product.id}`}>
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition"
            onError={handleError}
            loading="lazy"
          />
        </div>
      </Link>

      <div className="p-4">
        <Link
          to={`/products/${product.id}`}
          className="font-semibold line-clamp-1 hover:underline"
        >
          {product.name}
        </Link>
        <div className="mt-1 text-orange-600 font-bold">
          {money(product.price)}
        </div>

        {/* các nút tuỳ trang (giữ contract cũ nếu có) */}
        <div className="mt-3 flex items-center gap-2">
          {onToggleFavorite && (
            <button
              className="px-3 py-1.5 rounded-full border text-sm hover:bg-gray-50"
              onClick={() => onToggleFavorite(product.id)}
            >
              Bỏ thích
            </button>
          )}

          {ownerView && (
            <>
              <Link
                to={`/products/${product.id}/edit`}
                className="px-3 py-1.5 rounded-full border text-sm hover:bg-gray-50"
              >
                Sửa
              </Link>
              <button
                className="px-3 py-1.5 rounded-full border text-sm text-rose-600 hover:bg-rose-50"
                onClick={() => onDeleted?.(product.id)}
              >
                Xoá
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
