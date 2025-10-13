// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../models/db.js";

dotenv.config();

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: "❌ Không có token, vui lòng đăng nhập" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, ... }

    // Cập nhật last_seen_at (throttle ~2 phút)
    try {
      await pool.query(
        `UPDATE users
           SET last_seen_at = NOW()
         WHERE id = $1
           AND (last_seen_at IS NULL OR NOW() - last_seen_at > INTERVAL '2 minutes')`,
        [decoded.id]
      );
    } catch (e) {
      // Không làm vỡ request nếu lỗi
      console.warn("last_seen_at update skipped:", e.message);
    }

    next();
  } catch (err) {
    console.error("⚠️ Token lỗi:", err.message);
    return res.status(403).json({ error: "❌ Token không hợp lệ hoặc đã hết hạn" });
  }
};
