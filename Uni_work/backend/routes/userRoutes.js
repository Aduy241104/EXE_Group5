// backend/routes/userRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Đổi mật khẩu cho chính mình
router.put("/me/password", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ error: "Thiếu old_password hoặc new_password" });
    }

    const r = await pool.query("SELECT password FROM users WHERE id=$1", [userId]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Không tìm thấy user" });

    const ok = await bcrypt.compare(old_password, r.rows[0].password);
    if (!ok) return res.status(400).json({ error: "Mật khẩu cũ không đúng" });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2", [hashed, userId]);

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Lỗi đổi mật khẩu:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// (Ví dụ) cập nhật profile cơ bản
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, phone, address } = req.body;

    const { rows } = await pool.query(
      `UPDATE users
          SET username = COALESCE($1, username),
              phone    = COALESCE($2, phone),
              address  = COALESCE($3, address),
              updated_at = NOW()
        WHERE id = $4
      RETURNING id, username, email, phone, address`,
      [username ?? null, phone ?? null, address ?? null, userId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Lỗi cập nhật profile:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
