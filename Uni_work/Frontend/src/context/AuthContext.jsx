// AuthContext.jsx
import { createContext, useEffect, useState } from "react";
import api from "@/lib/api";
export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadMe = async () => {
      try {
        const { data } = await api.get("/api/auth/me"); // ⬅️ đổi từ api.get
        if (mounted) setUser(data);
      } catch (e) {
        setUser(null); // chưa đăng nhập
      }
    };
    loadMe();
    return () => { mounted = false; };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    // Nếu bạn dùng Bearer thay vì cookie, set header:
    // api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await api.post("/api/auth/logout"); } catch {}
    // delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
