// backend/routes/sellerRoutes.js
import { Router } from "express";
import pool from "../models/db.js";

const router = Router();

router.get("/:id/metrics", async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy thông tin người bán
    const userRes = await pool.query(
      `SELECT id, username, avatar_url, phone, verified
       FROM users WHERE id = $1`,
      [id]
    );

    if (userRes.rowCount === 0)
      return res.status(404).json({ message: "Seller not found" });

    const seller = userRes.rows[0];

    // Lấy thống kê review
    const reviewRes = await pool.query(
      `SELECT
         COALESCE(AVG(pr.rating), 0) AS avg_rating,
         COALESCE(COUNT(pr.*), 0) AS reviews_count
       FROM products p
       LEFT JOIN product_reviews pr ON pr.product_id = p.id
       WHERE p.user_id = $1`,
      [id]
    );

    const review = reviewRes.rows[0] || { avg_rating: 0, reviews_count: 0 };

    res.json({
      ...seller,
      avg_rating: Number(review.avg_rating || 0),
      reviews_count: Number(review.reviews_count || 0),
      response_rate: 96,
      response_time_sec: 900,
    });
  } catch (err) {
    console.error("Seller metrics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
