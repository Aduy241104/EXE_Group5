// Sidebar.jsx
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function Sidebar() {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await api.get("/api/categories"); // ⬅️ đổi từ api.get
        if (mounted) setCats(data);
      } catch (e) {
        console.error("load categories:", e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <aside>{/* render cats */}</aside>
  );
}
