import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loadingUser } = useContext(AuthContext);

  // CHỜ AuthContext khôi phục phiên khi F5
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Đang tải phiên đăng nhập...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
