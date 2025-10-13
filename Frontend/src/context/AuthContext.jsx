import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

export const AuthContext = createContext();

async function tryEndpoints(fnList) {
  for (const fn of fnList) {
    try {
      const data = await fn();
      return data;
    } catch (e) {
      // nếu lỗi không phải 404 thì dừng luôn
      if (e?.response && e.response.status !== 404) throw e;
      // 404 thì thử endpoint tiếp theo
    }
  }
  throw new Error("All endpoints failed (404).");
}

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Load /me (giữ phiên sau F5)
  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        if (!token) {
          if (!stopped) setUser(null);
          return;
        }
        // Ưu tiên /api/auth/me, fallback 1-2 biến thể khác
        const res = await tryEndpoints([
          () => api.get("/api/auth/me"),
          () => api.get("/api/users/me"),
          () => api.get("/api/user/me"),
        ]);
        if (!stopped) setUser(res.data);
      } catch {
        localStorage.removeItem("token");
        if (!stopped) {
          setUser(null);
          setToken("");
        }
      } finally {
        if (!stopped) setReady(true);
      }
    })();
    return () => { stopped = true; };
  }, [token]);

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    if (data?.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
    }
    setUser(data.user || null);
    return data.user;
  };

  const logout = async () => {
    try { await api.post("/api/auth/logout"); } catch {}
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  // ==== Cách A + fallback
  const updateProfile = async (payload) => {
    try {
      const res = await tryEndpoints([
        () => api.put("/api/auth/me", payload),
        () => api.put("/api/users/profile", payload),
        () => api.put("/api/user/profile", payload),
      ]);
      setUser(res.data.user || res.data);
      return true;
    } catch {
      return false;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await tryEndpoints([
        () => api.put("/api/auth/password", { oldPassword, newPassword }),
        () => api.put("/api/users/password", { oldPassword, newPassword }),
        () => api.put("/api/user/password", { oldPassword, newPassword }),
      ]);
      return true;
    } catch {
      return false;
    }
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      token,
      ready,
      loadingUser: !ready,
      login,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, token, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
