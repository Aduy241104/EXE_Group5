// backend/routes/addressRoutes.js
import express from "express";
import { authMiddleware as verifyToken } from "../middleware/authMiddleware.js";
import pool from "../models/db.js";

const router = express.Router();

// 🧠 Lấy danh sách địa chỉ
router.get("/users/:id/addresses", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM addresses WHERE user_id = $1 ORDER BY id DESC", [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Get addresses error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ➕ Thêm địa chỉ mới
router.post("/addresses", verifyToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { name, phone, address } = req.body;

    // Ghi vào đúng cột thật đang dùng: full_name & address_line
    const result = await pool.query(
      `INSERT INTO addresses (user_id, full_name, phone, address_line)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, name, phone, address]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Add address error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✏️ Cập nhật địa chỉ
router.put("/addresses/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;
    const result = await pool.query(
      "UPDATE addresses SET full_name=$1, phone=$2, address_line=$3 WHERE id=$4 RETURNING *",
      [name, phone, address, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update address error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🗑️ Xóa địa chỉ
router.delete("/addresses/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM addresses WHERE id=$1", [id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete address error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ⭐ Đặt mặc định
router.put("/addresses/:id/default", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    await pool.query("UPDATE addresses SET is_default=false WHERE user_id=$1", [user.id]);
    await pool.query("UPDATE addresses SET is_default=true WHERE id=$1", [id]);
    res.json({ message: "Set default success" });
  } catch (err) {
    console.error("Set default error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
