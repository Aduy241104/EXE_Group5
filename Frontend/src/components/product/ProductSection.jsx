// src/components/product/ProductSection.jsx
import { useEffect, useState } from "react";
import ProductGrid from "@/components/product/ProductGrid";

export default function ProductSection() {
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("forYou");

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch((err) => console.error("❌ Lỗi:", err));
  }, []);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b">
        <button
          className={`pb-2 font-semibold ${
            tab === "forYou" ? "border-b-2 border-orange-500" : ""
          }`}
          onClick={() => setTab("forYou")}
        >
          Dành cho bạn
        </button>
        <button
          className={`pb-2 font-semibold ${
            tab === "latest" ? "border-b-2 border-orange-500" : ""
          }`}
          onClick={() => setTab("latest")}
        >
          Mới nhất
        </button>
      </div>

      {/* Hiển thị sản phẩm */}
      <ProductGrid products={products.slice(0, 10)} />

      {/* Nút xem thêm */}
      <div className="flex justify-center mt-6">
        <button className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition">
          Xem thêm
        </button>
      </div>
    </div>
  );
}
