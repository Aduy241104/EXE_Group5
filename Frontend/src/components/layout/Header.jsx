// // src/components/layout/Header.jsx
// import { motion } from "framer-motion";
// import { Link } from "react-router-dom";
// import { useContext, useState, useEffect } from "react";
// import { AuthContext } from "@/context/AuthContext";

// const Header = () => {
//   const { user } = useContext(AuthContext);
//   const [isScrolled, setIsScrolled] = useState(false);

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 50);
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   return (
//     <header className="bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-md">
//       {/* Chỉ hiển thị tiêu đề + slogan khi chưa scroll */}
//       {!isScrolled && (
//         <div className="container mx-auto text-center px-6 py-10">
//           <motion.h1
//             initial={{ y: -40, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ duration: 0.7 }}
//             className="text-4xl md:text-5xl font-extrabold mb-3 drop-shadow"
//           >
//             UniTrade – <span className="text-yellow-100">Mua bán dễ dàng</span>
//           </motion.h1>

//           <motion.p
//             initial={{ y: 30, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ duration: 0.8, delay: 0.3 }}
//             className="text-lg md:text-xl opacity-90"
//           >
//             Kết nối người mua và người bán – Nhanh chóng, an toàn, tiện lợi
//           </motion.p>
//         </div>
//       )}

//       {/* Thanh tìm kiếm sticky (luôn hiển thị) */}
//       <div
//         className={`sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-yellow-400 shadow-md transition-all duration-300 ${
//           isScrolled ? "py-2" : "py-4"
//         }`}
//       >
//         <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-3 px-6">
//           {/* Ô tìm kiếm */}
//           <div
//             className={`flex bg-white rounded-full shadow overflow-hidden transition-all duration-300 ${
//               isScrolled ? "w-full md:w-1/2" : "w-full md:w-2/3 lg:w-1/2"
//             }`}
//           >
//             <input
//               type="text"
//               placeholder="🔍 Tìm kiếm sản phẩm, danh mục..."
//               className="flex-1 px-5 py-2 text-gray-700 focus:outline-none"
//             />
//             <button className="bg-orange-600 px-5 md:px-6 text-white font-semibold hover:bg-orange-700 transition">
//               Tìm kiếm
//             </button>
//           </div>

//           {/* Nút đăng tin */}
//           {user && (
//             <Link
//               to="/post/create"
//               className={`bg-white text-orange-600 font-semibold rounded-full shadow hover:bg-yellow-100 transition ${
//                 isScrolled ? "px-4 py-2 text-sm" : "px-6 py-3 text-base"
//               }`}
//             >
//               + Đăng tin ngay
//             </Link>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;
