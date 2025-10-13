import React from "react";

export default function Hero() {
  return (
    <section className="bg-orange-500 text-white py-20 text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        UniTrade – Mua bán nhanh chóng, tiện lợi
      </h1>
      <p className="text-lg md:text-xl mb-6">
        Nơi kết nối người mua và người bán, mọi lúc mọi nơi.
      </p>
      <a
        href="/post"
        className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-full shadow hover:bg-gray-100"
      >
        Đăng tin ngay
      </a>
    </section>
  );
}
