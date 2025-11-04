import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const API = import.meta.env.VITE_API || "http://localhost:5000";

export default function BannerCarousel() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/banner`)
      .then((res) => res.json())
      .then(setBanners)
      .catch(console.error);
  }, []);

  if (!banners.length) return null;

  return (
    <div className="container mx-auto px-6 mt-6">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 5000 }}
        loop
        pagination={{ clickable: true }}
      >
        {banners.map((b) => (
          <SwiperSlide key={b.id}>
            <a href={b.link}>
              <img
                src={`${API}${b.image_url}`}
                alt="banner"
                className="w-full h-[420px] object-cover rounded-2xl shadow-md"
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
