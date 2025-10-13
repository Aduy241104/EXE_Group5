// backend/routes/productRoutes.js
import express from "express";
import path from "path";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { diskUploader } from "../utils/uploader.js";
import {
  validateProductCreate,
  validateProductUpdate,
} from "../middleware/validators.js";
import { redeemAfterCreatePost } from "../services/feeService.js";

const router = express.Router();

/* ================= Upload ================= */
const upload = diskUploader("products"); // có limit + fileFilter trong utils/uploader.js

/* ================= Helpers ================= */
const ABS = process.env.BASE_URL || "http://localhost:5000";

// ✅ Chuẩn hoá ảnh: filename | "uploads/..." | "/uploads/..." | http(s) | "\" (Windows)
const img = (filename) => {
  if (!filename) return null;
  let raw = String(filename).replace(/\\/g, "/");        // windows -> posix
  if (/^https?:\/\//i.test(raw)) return raw;            // đã là URL tuyệt đối
  raw = raw.replace(/^\/?uploads\//i, "");              // bỏ tiền tố uploads/ nếu có
  // Nếu chuỗi không có subfolder (dữ liệu cũ chỉ là 'abc.jpg') -> mặc định products/
  if (!/^[^/]+\/[^/]+/.test(raw)) raw = `products/${raw}`;
  return `${ABS}/uploads/${raw}`;
};

const toProduct = (row) => ({ ...row, image_url: img(row.image_url) });

/* =============== CREATE (transaction + redeem) =============== */
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  validateProductCreate,
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { name, price, description, category_id, voucher_code } = req.body;
      // 🔧 Lưu vào DB dạng 'products/<filename>' để trùng static '/uploads'
      const imageFilename = req.file ? `products/${req.file.filename}` : null;

      if (!name || !price || !description || !category_id) {
        return res.status(400).json({ error: "Thiếu thông tin sản phẩm" });
      }

      await client.query("BEGIN");

      const ins = await client.query(
        `INSERT INTO products (name, price, description, image_url, user_id, category_id)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [name, price, description, imageFilename, req.user.id, category_id]
      );
      const post = ins.rows[0];

      const { fee } = await redeemAfterCreatePost({
        client,
        sellerId: req.user.id,
        categoryId: category_id,
        voucherCode: (voucher_code || "").trim() || null,
        postId: post.id,
      });

      await client.query("COMMIT");

      return res.status(201).json({
        ...toProduct(post),
        fee,
      });
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("create product with fee:", e);
      return res.status(500).json({ error: "Server error" });
    } finally {
      client.release();
    }
  }
);

/* =============== COUNTER Myposts =============== */
router.get("/myposts/count", authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS count FROM products WHERE user_id=$1`,
      [req.user.id]
    );
    return res.json({ count: r.rows[0].count || 0 });
  } catch (e) {
    console.error("myposts count:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =============== CATEGORIES tiện ích =============== */
router.get("/categories/all", async (_req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, name, slug FROM categories ORDER BY id ASC"
    );
    return res.json(r.rows);
  } catch (e) {
    console.error("categories:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =============== MY POSTS (list) =============== */
router.get("/myposts", authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT p.id, p.name, p.price, p.description, p.image_url, p.created_at,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug
         FROM products p
         JOIN categories c ON c.id = p.category_id
        WHERE p.user_id = $1
     ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    return res.json(r.rows.map(toProduct));
  } catch (e) {
    console.error("myposts:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =============== FAVORITES =============== */
router.get("/favorites", authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT p.id, p.name, p.price, p.description, p.image_url, p.created_at,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
              u.username AS seller_name, u.phone AS seller_phone
         FROM favorites f
         JOIN products p ON p.id = f.product_id
         JOIN categories c ON c.id = p.category_id
         JOIN users u ON u.id = p.user_id
        WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    return res.json(r.rows.map(toProduct));
  } catch (e) {
    console.error("favorites:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/favorites/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO favorites (user_id, product_id)
       VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.id]
    );
    return res.json({ success: true });
  } catch (e) {
    console.error("fav add:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/favorites/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM favorites WHERE user_id=$1 AND product_id=$2`,
      [req.user.id, req.params.id]
    );
    return res.json({ success: true });
  } catch (e) {
    console.error("fav del:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =============== SEARCH (autocomplete) =============== */
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").toLowerCase();
    const r = await pool.query(
      `SELECT id, name, price, image_url
         FROM products
        WHERE LOWER(name) LIKE $1
        LIMIT 10`,
      [`%${q}%`]
    );
    return res.json(r.rows.map(toProduct));
  } catch (e) {
    console.error("search:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =============== FEATURED (đặt TRƯỚC /:id) =============== */
router.get("/featured", async (req, res) => {
  try {
    const lim = Math.min(20, Math.max(1, parseInt(req.query.limit || "10", 10)));
    const { rows } = await pool.query(
      `SELECT id, name, price, image_url
         FROM products
        WHERE COALESCE(is_available, TRUE) = TRUE
        ORDER BY RANDOM()
        LIMIT $1`,
      [lim]
    );
    return res.json(rows.map(toProduct));
  } catch (e) {
    console.error("featured:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =============== REVIEWS (đặt TRƯỚC /:id) =============== */
const reviewUpload = diskUploader("reviews");

router.get("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query(
      `SELECT pr.id, pr.rating, pr.content, pr.images, pr.created_at,
              u.username, u.avatar_url
         FROM product_reviews pr
    LEFT JOIN users u ON u.id = pr.user_id
        WHERE pr.product_id = $1
     ORDER BY pr.created_at DESC
        LIMIT 100`,
      [id]
    );
    return res.json(r.rows);
  } catch (e) {
    console.error("reviews list:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post(
  "/:id/reviews",
  authMiddleware,
  reviewUpload.array("images", 6),
  async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const { rating, content } = req.body;

      // TODO: Lưu review + images vào product_reviews

      const agg = await pool.query(
        `SELECT AVG(rating)::numeric(10,2) AS avg, COUNT(*)::int AS count
           FROM product_reviews
          WHERE product_id = $1`,
        [productId]
      );
      const rating_avg = Number(agg.rows[0].avg || 0);
      const rating_count = Number(agg.rows[0].count || 0);
      await pool.query(
        `UPDATE products
            SET rating_avg=$1, rating_count=$2, updated_at=NOW()
          WHERE id=$3`,
        [rating_avg, rating_count, productId]
      );

      const io = req.app.get("io");
      io?.to(`product:${productId}`).emit("review:created", {
        product_id: productId,
        rating_avg,
        rating_count,
      });

      return res.status(201).json({ ok: true });
    } catch (e) {
      console.error("create review:", e);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/* =============== LIST with pagination =============== */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const offset = (page - 1) * limit;
    const { category = "", q = "" } = req.query;

    const conds = [];
    const params = [];
    let p = 1;

    if (category) {
      conds.push(`category_id = $${p++}`);
      params.push(Number(category));
    }
    if (q) {
      conds.push(`(LOWER(name) LIKE $${p} OR LOWER(description) LIKE $${p})`);
      params.push(`%${String(q).toLowerCase()}%`);
      p++;
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const listSql = `
      SELECT p.*, u.username AS seller_name, u.phone AS seller_phone
        FROM products p
   LEFT JOIN users u ON u.id = p.user_id
       ${where}
    ORDER BY p.updated_at DESC
       LIMIT $${p++} OFFSET $${p++}`;
    const countSql = `SELECT COUNT(*)::int AS total FROM products ${where}`;

    const listParams = [...params, limit, offset];
    const countParams = [...params];

    const [listRes, countRes] = await Promise.all([
      pool.query(listSql, listParams),
      pool.query(countSql, countParams),
    ]);

    return res.json({
      items: listRes.rows.map(toProduct),
      total: countRes.rows[0].total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(countRes.rows[0].total / limit)),
    });
  } catch (e) {
    console.error("list products:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =============== DETAIL =============== */
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.price, p.description, p.image_url, p.created_at,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
              u.id AS seller_id,
              u.username AS seller_name, u.phone AS seller_phone
         FROM products p
         JOIN categories c ON p.category_id = c.id
         JOIN users u      ON p.user_id     = u.id
        WHERE p.id = $1`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    return res.json(toProduct(rows[0]));
  } catch (err) {
    console.error("detail product:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =============== UPDATE / DELETE =============== */
router.put(
  "/:id",
  validateProductUpdate,
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const userId = req.user.id;

      const check = await pool.query(
        `SELECT id, user_id, image_url FROM products WHERE id=$1`,
        [productId]
      );
      if (!check.rowCount)
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      if (Number(check.rows[0].user_id) !== Number(userId)) {
        return res
          .status(403)
          .json({ error: "Bạn không có quyền sửa sản phẩm này" });
      }

      const { name, price, description, category_id } = req.body;
      // 🔧 Đồng bộ: lưu dạng 'products/<filename>'
      const newImageFilename = req.file ? `products/${req.file.filename}` : null;

      const { rows } = await pool.query(
        `UPDATE products
            SET name        = COALESCE($1, name),
                price       = COALESCE($2, price),
                description = COALESCE($3, description),
                image_url   = COALESCE($4, image_url),
                category_id = COALESCE($5, category_id),
                updated_at  = NOW()
          WHERE id = $6 AND user_id = $7
        RETURNING *`,
        [
          name ?? null,
          price ?? null,
          description ?? null,
          newImageFilename ?? null,
          category_id ?? null,
          productId,
          userId,
        ]
      );
      return res.json(toProduct(rows[0]));
    } catch (e) {
      console.error("update product:", e);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

router.delete("/:id", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const productId = Number(req.params.id);
    const isAdmin = (req.user?.role || "").toLowerCase() === "admin";
    const userId = req.user?.id;

    await client.query("BEGIN");

    const pre = await client.query(
      `SELECT id, user_id, image_url FROM products WHERE id = $1`,
      [productId]
    );
    if (pre.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }
    const ownerId = pre.rows[0].user_id;

    if (!isAdmin && Number(ownerId) !== Number(userId)) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "Bạn không có quyền xóa sản phẩm này" });
    }

    await client.query(`DELETE FROM product_reviews WHERE product_id = $1`, [
      productId,
    ]);
    await client.query(`DELETE FROM order_items WHERE product_id = $1`, [
      productId,
    ]);
    await client.query(`DELETE FROM favorites WHERE product_id = $1`, [
      productId,
    ]);

    const del = await client.query(
      `DELETE FROM products WHERE id = $1 RETURNING image_url`,
      [productId]
    );

    await client.query("COMMIT");

    // Xoá file vật lý (nếu có)
    const filename = del.rows[0]?.image_url;
    if (filename) {
      const filePath = path.join(process.cwd(), "uploads", filename);
      import("fs").then(({ unlink }) => unlink(filePath, () => {}));
    }

    return res.json({
      ok: true,
      message: isAdmin ? "Đã xóa (admin)" : "Đã xóa",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("delete product:", err);
    return res
      .status(500)
      .json({ error: "Server error", details: err.message });
  } finally {
    client.release();
  }
});

export default router;
