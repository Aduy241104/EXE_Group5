import express from "express";
import pool from "../models/db.js";

const router = express.Router();

// GET /api/categories/all
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, slug FROM categories ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Lỗi khi lấy categories:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
