// ProductGrid.jsx
import { useEffect, useState } from "react";
import api from "@/lib/api";
export default function ProductGrid() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await api.get("/api/products", {
          params: { limit: 20, page: 1 },
        }); // ⬅️ đổi từ api.get
        if (mounted) setItems(data.items || data);
      } catch (e) {
        console.error("load products:", e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div>{/* render items */}</div>
  );
}
