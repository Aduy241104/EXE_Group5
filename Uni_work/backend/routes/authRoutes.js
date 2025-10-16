// backend/routes/authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateRegister, validateLogin } from "../middleware/validators.js";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

// Đăng ký (dùng controller)
router.post("/register", validateRegister, register);

// Đăng nhập (dùng controller)
router.post("/login", validateLogin, login);

// Lấy user hiện tại
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, phone, school, student_id, address, age, role, avatar_url
         FROM users
        WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy user" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Lỗi /me:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
