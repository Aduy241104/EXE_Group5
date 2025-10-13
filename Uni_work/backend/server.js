// backend/server.js (ESM)
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";

// ===== Import routes (NHỚ đuôi .js trong ESM) =====
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import disputeRoutes from "./routes/disputeRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";          // nếu có
import notificationRoutes from "./routes/notificationRoutes.js"; // nếu có
// import { registerChatNamespace } from "./socket.js";         // chỉ import nếu file tồn tại
// import messageRoutes from "./routes/messageRoutes.js";       // chỉ import nếu file tồn tại

dotenv.config();

const app = express();

// ====== CORS (allow FE) ======
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:55000,http://localhost:5500"
).split(",");

import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const corsOptions = {
  origin(origin, cb) { if (!origin || allowedOrigins.includes(origin)) return cb(null, true); return cb(new Error("Not allowed by CORS")); },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use((req,res,next)=>{ res.header("Vary","Origin"); next(); });

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 500 }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== Security & basic middlewares =====
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use(
  cors({
    origin: (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(","),
    credentials: true,
  })
);
app.use(cookieParser()); // cần cho refresh token qua cookie
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== __dirname for ESM =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Ensure uploads folders exist =====
const uploadDir = path.join(__dirname, "uploads");
const avatarDir = path.join(uploadDir, "avatars");
const reviewDir = path.join(uploadDir, "reviews");
[uploadDir, avatarDir, reviewDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ===== Static for uploads (cache header có thể thêm sau) =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/disputes", disputeRoutes);

// Tùy dự án: đổi về /api/reviews nếu route là reviews thay vì products
app.use("/api/reviews", reviewRoutes);

// Tránh mount trùng /api/notifications 2 lần
app.use("/api/notifications", notificationRoutes);

// Nếu có messageRoutes:
// app.use("/api/messages", messageRoutes);

// ===== Socket.IO =====
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(","), credentials: true },
});

// Nếu có chat namespace riêng, bỏ comment dòng dưới:
// registerChatNamespace?.(io);

// Cho controller sử dụng io khi cần
app.set("io", io);

// Kênh realtime đơn giản cho product (giữ lại nếu bạn dùng)
io.on("connection", (socket) => {
  socket.on("product:join", ({ productId }) => {
    if (productId) socket.join(`product:${productId}`);
  });
  socket.on("product:leave", ({ productId }) => {
    if (productId) socket.leave(`product:${productId}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
