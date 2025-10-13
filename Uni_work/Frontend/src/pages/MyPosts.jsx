import api from '../lib/api';
// src/pages/MyPosts.jsx
import { useEffect, useState } from "react";

import ProductCard from "../components/product/ProductCard";

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await api.get("http://localhost:5000/api/products/myposts", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setPosts(res.data);
      } catch (err) {
        console.error("❌ Lỗi khi load tin đã đăng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <p className="text-center mt-10">⏳ Đang tải tin đã đăng...</p>;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Tin đã đăng</h1>

      {posts.length === 0 ? (
        <p className="text-gray-600">Bạn chưa đăng tin nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {posts.map((product) => (
<ProductCard
  key={product.id}
  product={product}
  ownerView
  onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
  onUpdated={(updated) =>
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }
/>

          ))}
        </div>
      )}
    </div>
  );
};

export default MyPosts;
