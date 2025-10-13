import React, { useState } from "react";

export default function PostProduct() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProduct = {
      id: Date.now(),
      title,
      price: Number(price),
      image,
      brand: "Người bán",
    };
    const products = JSON.parse(localStorage.getItem("products")) || [];
    products.push(newProduct);
    localStorage.setItem("products", JSON.stringify(products));
    alert("Đăng tin thành công!");
    window.location.href = "/";
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Đăng tin mới</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Tên sản phẩm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-4 py-2 rounded"
          required
        />
        <input
          type="number"
          placeholder="Giá (VND)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border px-4 py-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="URL hình ảnh"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="w-full border px-4 py-2 rounded"
          required
        />
        <button
          type="submit"
          className="px-6 py-3 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Đăng tin
        </button>
      </form>
    </div>
  );
}
