import { Router } from "express";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const router = Router();

/* --- Config Upload Ảnh --- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "..", "uploads", "reviews");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("Chỉ chấp nhận ảnh (jpg, png, webp)"));
  }
});

/* ==========================================
   🔒 API 1: Kiểm tra quyền đánh giá
   Frontend gọi cái này để Ẩn/Hiện form review
========================================== */
router.get("/:productId/permission", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // 1. Check: Đã mua hàng thành công chưa?
    const orderCheck = await pool.query(
      `SELECT o.id 
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1 
         AND oi.product_id = $2 
         AND o.status = 'completed'`, // ⚠️ Chỉ cho phép khi đơn đã hoàn thành
      [userId, productId]
    );

    if (orderCheck.rowCount === 0) {
      return res.json({
        canReview: false,
        message: "Bạn cần mua và hoàn tất đơn hàng để đánh giá."
      });
    }

    // 2. Check: Đã đánh giá chưa? (Mỗi người 1 lần)
    const reviewCheck = await pool.query(
      `SELECT id FROM product_reviews WHERE user_id = $1 AND product_id = $2`,
      [userId, productId]
    );

    if (reviewCheck.rowCount > 0) {
      return res.json({
        canReview: false,
        message: "Bạn đã đánh giá sản phẩm này rồi."
      });
    }

    res.json({ canReview: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ canReview: false, message: "Lỗi server" });
  }
});

/* ==========================================
   📝 API 2: Gửi đánh giá (Có validate lại)
========================================== */
router.post("/:productId/reviews", authMiddleware, upload.array("images", 5), async (req, res) => {
  const client = await pool.connect();
  try {
    const { productId } = req.params;
    const { rating, content } = req.body;
    const userId = req.user.id;

    if (!rating || !content) return res.status(400).json({ message: "Thiếu thông tin" });

    // --- VALIDATE SERVER SIDE (Bảo mật) ---
    const orderCheck = await client.query(
      `SELECT o.id FROM orders o JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'completed'`,
      [userId, productId]
    );
    if (orderCheck.rowCount === 0) {
      return res.status(403).json({ message: "Bạn chưa mua sản phẩm này." });
    }

    const dupCheck = await client.query(
      `SELECT id FROM product_reviews WHERE user_id = $1 AND product_id = $2`,
      [userId, productId]
    );
    if (dupCheck.rowCount > 0) {
      return res.status(400).json({ message: "Bạn đã đánh giá rồi." });
    }
    // --------------------------------------

    const imageUrls = (req.files || []).map((f) => `/uploads/reviews/${path.basename(f.path)}`);

    await client.query(
      `INSERT INTO product_reviews (product_id, user_id, rating, content, images)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [productId, userId, Number(rating), content, JSON.stringify(imageUrls)]
    );

    res.json({ message: "Đánh giá thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi hệ thống" });
  } finally {
    client.release();
  }
});

/* API 3: Lấy danh sách Review (Phân trang) - Như code cũ */
router.get("/:productId/reviews", async (req, res) => {
  // ... (Giữ nguyên logic phân trang bạn đã có)
  // Đảm bảo trả về avatar, username từ bảng users
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const reviewsQuery = pool.query(
      `SELECT r.*, u.username, u.avatar_url 
             FROM product_reviews r JOIN users u ON r.user_id = u.id 
             WHERE r.product_id = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );
    const countQuery = pool.query(`SELECT COUNT(*)::int as total FROM product_reviews WHERE product_id=$1`, [productId]);

    const [rRes, cRes] = await Promise.all([reviewsQuery, countQuery]);

    // Normalize images json
    const normalized = rRes.rows.map(r => ({
      ...r,
      images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images
    }));

    res.json({
      reviews: normalized,
      total: cRes.rows[0].total,
      hasMore: offset + rRes.rowCount < cRes.rows[0].total
    });
  } catch (e) { res.status(500).send("Lỗi"); }
});

export default router;