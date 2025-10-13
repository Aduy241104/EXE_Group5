// import { Link } from "react-router-dom";
// import { Heart, MessageCircle, PlusCircle, User } from "lucide-react";
// import { useContext, useState, useRef, useEffect } from "react";
// import { AuthContext } from "../../context/AuthContext";
// import { motion, AnimatePresence } from "framer-motion";

// const Navbar = () => {
//   const { user, logout } = useContext(AuthContext);
//   const [open, setOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <nav className="bg-gradient-to-r from-orange-500 to-red-500 shadow-md">
//       <div className="container mx-auto px-6 flex items-center justify-between h-20 relative">
//         {/* Trái */}
//         <div className="flex items-center space-x-6 text-white text-xl">
//           <Link to="/favorites">
//             <Heart className="w-7 h-7 hover:text-pink-200 transition" />
//           </Link>
//           <Link to="/messages">
//             <MessageCircle className="w-7 h-7 hover:text-blue-200 transition" />
//           </Link>
//           <Link to="/post/create">
//             <PlusCircle className="w-7 h-7 hover:text-green-200 transition" />
//           </Link>
//         </div>

//         {/* Logo */}
//         <div className="absolute left-1/2 transform -translate-x-1/2">
//           <Link to="/">
//             <img
//               src="/logo.png"
//               alt="UniTrade"
//               className="h-16 w-auto object-contain p-1 bg-white rounded-full shadow-md"
//             />
//           </Link>
//         </div>

//         {/* Phải */}
//         <div className="flex items-center text-white relative">
//           {user ? (
//             <div className="relative" ref={dropdownRef}>
//               <motion.span
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5 }}
//                 className="mr-3 font-medium"
//               >
//                 Xin chào, {user.username || user.email} 👋
//               </motion.span>

//               <button onClick={() => setOpen(!open)} className="focus:outline-none">
//                 <motion.div
//                   animate={{ rotate: open ? 180 : 0 }}
//                   transition={{ duration: 0.3 }}
//                 >
//                   <User className="w-8 h-8 hover:text-gray-200 transition" />
//                 </motion.div>
//               </button>

//               <AnimatePresence>
//                 {open && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -10, scale: 0.95 }}
//                     animate={{ opacity: 1, y: 0, scale: 1 }}
//                     exit={{ opacity: 0, y: -10, scale: 0.95 }}
//                     transition={{ duration: 0.2 }}
//                     className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg z-50 overflow-hidden"
//                   >
//                     <Link
//                       to="/profile"
//                       className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
//                       onClick={() => setOpen(false)}
//                     >
//                       Hồ sơ chi tiết
//                     </Link>
//                     <Link
//                       to="/myposts"
//                       className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
//                       onClick={() => setOpen(false)}
//                     >
//                       Tin đã đăng
//                     </Link>
//                     <Link
//                       to="/favorites"
//                       className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
//                       onClick={() => setOpen(false)}
//                     >
//                       Yêu thích
//                     </Link>
//                     <button
//                       onClick={() => {
//                         logout();
//                         setOpen(false);
//                       }}
//                       className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
//                     >
//                       Đăng xuất
//                     </button>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           ) : (
//             <div className="flex gap-3">
//               <Link
//                 to="/login"
//                 className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
//               >
//                 Đăng nhập
//               </Link>
//               <Link
//                 to="/register"
//                 className="bg-yellow-300 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
//               >
//                 Đăng ký
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;
