import api from "@/lib/api";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import ProductCard from "@/components/product/ProductCard";

export default function Favorites() {
  const { user, token, loadingUser } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const res = await api.get("/api/products/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("❌ Lỗi khi load favorites:", err);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, token]);

  const toggleFavorite = async (productId) => {
    try {
      await api.delete(`/api/products/favorites/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error("❌ Lỗi khi xóa favorite:", err);
    }
  };

  if (loadingUser) return <p className="text-center py-10">⏳ Đang kiểm tra tài khoản...</p>;
  if (!user) return <p className="text-center py-10">⚠️ Bạn cần đăng nhập.</p>;
  if (loading) return <p className="text-center py-10">⏳ Đang tải danh sách yêu thích...</p>;

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">❤️ Sản phẩm yêu thích</h1>
      {favorites.length === 0 ? (
        <p>Bạn chưa thích sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {favorites.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
