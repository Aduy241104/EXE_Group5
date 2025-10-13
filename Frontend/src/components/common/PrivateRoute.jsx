// src/components/common/PrivateRoute.jsx
import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const { token, loadingUser } = useAuth();
  const location = useLocation();

  // ✅ Khi chưa sẵn sàng (đang đồng bộ /me) thì KHÔNG điều hướng
  if (loadingUser) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-gray-500">
        Đang tải phiên...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? children : <Outlet />;
}
