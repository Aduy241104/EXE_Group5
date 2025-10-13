import { Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import AuthProvider from "@/context/AuthContext";

// Layout
import Topbar from "@/components/layout/Topbar";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";

// Pages & Components
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminUsers from "@/pages/AdminUsers";
import AdminNotify from "@/pages/AdminNotify";
import Messages from "@/pages/Messages";
import MyPosts from "@/pages/MyPosts";
import CreatePost from "@/pages/CreatePost";
import Favorites from "@/pages/Favorites";
import Profile from "@/pages/Profile";
import ProductDetail from "@/components/product/ProductDetail";
import ProductGrid from "@/components/product/ProductGrid";
import SellerDashboard from "@/pages/SellerDashboard";
import SellerOrders from "@/pages/SellerOrders";
import BuyerOrders from "@/pages/BuyerOrders";
import OrderDetail from "@/pages/OrderDetail";

// thêm:
import VouchersPage from "@/pages/seller/VouchersPage.jsx";
import VoucherList from "@/pages/admin/VoucherList.jsx";
import VoucherEdit from "@/pages/admin/VoucherEdit.jsx";
import VoucherAssign from "@/pages/admin/VoucherAssign.jsx";
import VoucherRedemptions from "@/pages/admin/VoucherRedemptions.jsx";

// Common
import PrivateRoute from "@/components/common/PrivateRoute";
import PageWrapper from "@/components/common/PageWrapper";
import AdminChat from "@/components/chat/AdminChat";

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const location = useLocation();

  useEffect(() => {
    document.title = "Trang chủ | UniTrade";
  }, []);

  return (
    <AuthProvider>
      {/* Khung bố cục toàn trang */}
      <div className="min-h-screen flex flex-col bg-white">
        {/* Sidebar dạng overlay */}
        <Sidebar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Topbar */}
        <Topbar />

        {/* Nội dung chiếm phần còn lại */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public */}
              <Route
                path="/"
                element={
                  <PageWrapper>
                    <Home selectedCategory={selectedCategory} />
                  </PageWrapper>
                }
              />
              <Route
                path="/login"
                element={
                  <PageWrapper>
                    <Login />
                  </PageWrapper>
                }
              />
              <Route
                path="/register"
                element={
                  <PageWrapper>
                    <Register />
                  </PageWrapper>
                }
              />
              <Route
                path="/products"
                element={
                  <PageWrapper>
                    <ProductGrid />
                  </PageWrapper>
                }
              />
              <Route
                path="/products/:id"
                element={
                  <PageWrapper>
                    <ProductDetail />
                  </PageWrapper>
                }
              />

              {/* Private */}
              <Route
                path="/favorites"
                element={
                  <PrivateRoute>
                    <PageWrapper>
                      <Favorites />
                    </PageWrapper>
                  </PrivateRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <PrivateRoute>
                    <PageWrapper>
                      <Messages />
                    </PageWrapper>
                  </PrivateRoute>
                }
              />
              <Route
                path="/myposts"
                element={
                  <PrivateRoute>
                    <PageWrapper>
                      <MyPosts />
                    </PageWrapper>
                  </PrivateRoute>
                }
              />
              <Route
                path="/post/create"
                element={
                  <PrivateRoute>
                    <PageWrapper>
                      <CreatePost />
                    </PageWrapper>
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <PageWrapper>
                      <Profile />
                    </PageWrapper>
                  </PrivateRoute>
                }
              />

              {/* Admin */}
              <Route
                path="/admin/users"
                element={
                  <PrivateRoute>
                    <PageWrapper>
                      <AdminUsers />
                    </PageWrapper>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/notify"
                element={
                  <PrivateRoute>
                    <PageWrapper>
                      <AdminNotify />
                    </PageWrapper>
                  </PrivateRoute>
                }
              />

              {/* Seller */}
              <Route
                path="/seller/dashboard"
                element={
                  <PrivateRoute>
                    <PageWrapper>
                      <SellerDashboard />
                    </PageWrapper>
                  </PrivateRoute>
                }
              />
              <Route
                path="/seller/orders"
                element={
                  <PrivateRoute>
                    <PageWrapper>
                      <SellerOrders />
                    </PageWrapper>
                  </PrivateRoute>
                }
              />

              {/* Orders */}
              <Route
                path="/orders/buyer"
                element={
                  <PrivateRoute>
                    <PageWrapper>
                      <BuyerOrders />
                    </PageWrapper>
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <PrivateRoute>
                    <PageWrapper>
                      <OrderDetail />
                    </PageWrapper>
                  </PrivateRoute>
                }
              />
            </Routes>
          </AnimatePresence>
        </main>

        {/* Footer luôn ở đáy */}
        <Footer />

        {/* Chat admin popup */}
        <AdminChat />
      </div>
    </AuthProvider>
  );
}
