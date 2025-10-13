// backend/routes/productRoutes.js (ESM, đã sửa sạch)
import express from "express";
import path from "path";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { diskUploader } from "../utils/uploader.js";
import { validateProductCreate, validateProductUpdate } from "../middleware/validators.js";

const router = express.Router();

/* ================= Upload ================= */
const upload = diskUploader("products"); // đã có fileFilter + limit bên utils/uploader.js

const ABS = process.env.BASE_URL || "http://localhost:5000";
const img = (filename) => (filename ? `${ABS}/uploads/${filename}` : null);

/* ================= Helpers ================= */
const toProduct = (row) => ({
  ...row,
  image_url: img(row.image_url),
});

/* =============== CREATE ==================== */
router.post(
  "/",
  validateProductCreate,
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, price, description, category_id } = req.body;
      const imageFilename = req.file ? req.file.filename : null;

      if (!name || !price || !description || !category_id) {
        return res.status(400).json({ error: "Thiếu thông tin sản phẩm" });
      }

      const { rows } = await pool.query(
        `INSERT INTO products (name, price, description, image_url, user_id, category_id)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [name, price, description, imageFilename, req.user.id, category_id]
      );
      res.status(201).json(toProduct(rows[0]));
    } catch (e) {
      console.error("create product:", e.message);
      res.status(500).json({ error: "Server error" });
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
    res.json({ count: r.rows[0].count || 0 });
  } catch (e) {
    console.error("myposts count:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* =============== CATEGORIES =============== */
router.get("/categories/all", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, name, slug FROM categories ORDER BY id ASC"
    );
    res.json(r.rows);
  } catch (e) {
    console.error("categories:", e.message);
    res.status(500).json({ error: "Server error" });
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
    res.json(r.rows.map(toProduct));
  } catch (e) {
    console.error("myposts:", e.message);
    res.status(500).json({ error: "Server error" });
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
    res.json(r.rows.map(toProduct));
  } catch (e) {
    console.error("favorites:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/favorites/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO favorites (user_id, product_id)
       VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("fav add:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/favorites/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM favorites WHERE user_id=$1 AND product_id=$2`,
      [req.user.id, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("fav del:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* =============== SEARCH (autocomplete) =============== */
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase();
    const r = await pool.query(
      `SELECT id, name AS title, image_url AS image
         FROM products
        WHERE LOWER(name) LIKE $1
        LIMIT 10`,
      [`%${q}%`]
    );
    res.json(r.rows.map((x) => ({ ...x, image: img(x.image) })));
  } catch (e) {
    console.error("search:", e.message);
    res.status(500).json({ error: "Server error" });
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
    res.json(rows.map(toProduct));
  } catch (e) {
    console.error("featured:", e.message);
    res.status(500).json({ error: "Server error" });
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
    res.json(r.rows);
  } catch (e) {
    console.error("reviews list:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post(
  "/:id/reviews",
  authMiddleware,
  reviewUpload.array("images", 6),
  async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const userId = req.user.id;
      const { rating, content } = req.body;

      // TODO: Lưu review + ảnh vào product_reviews
      // await pool.query(`INSERT INTO product_reviews ...`);

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

      res.status(201).json({ ok: true });
    } catch (e) {
      console.error("create review:", e.message);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* =============== LIST with pagination =============== */
// GET /api/products?page=1&limit=20&category=&q=
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
      params.push(`%${q.toLowerCase()}%`);
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

    res.json({
      items: listRes.rows.map(toProduct),
      total: countRes.rows[0].total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(countRes.rows[0].total / limit)),
    });
  } catch (e) {
    console.error("list products:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* =============== DETAIL (đặt SAU cùng) =============== */
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
    if (!rows.length) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    res.json(toProduct(rows[0]));
  } catch (err) {
    console.error("❌ Lỗi khi lấy chi tiết sản phẩm:", err.message);
    res.status(500).json({ error: "Server error" });
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
      if (!check.rowCount) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      if (check.rows[0].user_id !== userId) {
        return res.status(403).json({ error: "Bạn không có quyền sửa sản phẩm này" });
      }

      const { name, price, description, category_id } = req.body;
      const newImageFilename = req.file ? req.file.filename : null;

      const { rows } = await pool.query(
        `UPDATE products
            SET name        = COALESCE($1, name),
                price       = COALESCE($2, price),
                description = COALESCE($3, description),
                image_url   = COALESCE($4, image_url),
                category_id = COALESCE($5, category_id)
          WHERE id = $6 AND user_id = $7
        RETURNING *`,
        [name ?? null, price ?? null, description ?? null, newImageFilename ?? null, category_id ?? null, productId, userId]
      );
      res.json(toProduct(rows[0]));
    } catch (e) {
      console.error("update product:", e.message);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// XÓA sản phẩm (admin override hoặc chủ sở hữu)
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
      return res.status(403).json({ error: "Bạn không có quyền xóa sản phẩm này" });
    }

    await client.query(`DELETE FROM product_reviews WHERE product_id = $1`, [productId]);
    await client.query(`DELETE FROM order_items     WHERE product_id = $1`, [productId]);
    await client.query(`DELETE FROM favorites       WHERE product_id = $1`, [productId]);

    const del = await client.query(
      `DELETE FROM products WHERE id = $1 RETURNING image_url`,
      [productId]
    );

    await client.query("COMMIT");

    const filename = del.rows[0]?.image_url;
    if (filename) {
      const p = (await import("path")).default;
      const filePath = p.join(process.cwd(), "uploads", filename);
      import("fs").then(({ unlink }) => unlink(filePath, () => {}));
    }

    return res.json({ ok: true, message: isAdmin ? "Đã xóa (admin)" : "Đã xóa" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Lỗi khi xóa sản phẩm:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    client.release();
  }
});

export default router;
