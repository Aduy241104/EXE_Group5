// routes/categoryRoutes.js
import express from "express";
import pool from "../models/db.js"; // Đảm bảo đường dẫn đúng tới file db.js của bạn

const router = express.Router();

/**
 * ✅ Handler chung cho cả / và /all
 * Trả về mảng: [{ id, name, slug }]
 */
async function listCategories(req, res) {
  try {
    // Query database
    const { rows } = await pool.query(
      "SELECT id, name, slug FROM categories ORDER BY id ASC"
    );

    // Nếu không có dữ liệu
    if (!rows || rows.length === 0) {
      return res.status(200).json([]);
    }

    // Trả kết quả
    res.json(rows);
  } catch (err) {
    console.error("❌ GET /api/categories error:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

/* ---------- ROUTES ---------- */

// /api/categories
router.get("/", listCategories);

// /api/categories/all (backward compatible)
router.get("/all", listCategories);

/**
 * (Tùy chọn) Thêm route /api/categories/:id để lấy chi tiết 1 danh mục
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "SELECT id, name, slug FROM categories WHERE id = $1",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ GET /api/categories/:id error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
