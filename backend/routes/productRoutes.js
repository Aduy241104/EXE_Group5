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

// /* =============== CATEGORIES tiện ích =============== */
// router.get("/categories/all", async (req, res) => {
//   try {
//     const { rows } = await pool.query(
//       "SELECT id, name, slug FROM categories ORDER BY id ASC"
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error("GET /categories/all error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

/* ================= Upload ================= */
const upload = diskUploader("products");

/* ================= Helpers ================= */
const ABS = process.env.BASE_URL || "http://localhost:5000";
const img = (filename) => {
  if (!filename) return null;
  let raw = String(filename).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(raw)) return raw;
  raw = raw.replace(/^\/?uploads\//i, "");
  if (!/^[^/]+\/[^/]+/.test(raw)) raw = `products/${raw}`;
  return `${ABS}/uploads/${raw}`;
};
const toProduct = (row) => ({ ...row, image_url: img(row.image_url) });

/* =============== CREATE (transaction + redeem) =============== */
router.post(
  "/",
  authMiddleware,
  upload.array("images", 10),
  validateProductCreate,
  async (req, res) => {
    const client = await pool.connect();
    try {
      // 1. Thêm quantity vào destructuring
      const { name, price, description, category_id, voucher_code, quantity } = req.body;

      let imageFilename = null;
      if (req.files && req.files.length > 0) {
        imageFilename = `products/${req.files[0].filename}`;
      }

      if (!name || !price || !description || !category_id) {
        return res.status(400).json({ error: "Thiếu thông tin sản phẩm" });
      }

      await client.query("BEGIN");

      // 2. CẬP NHẬT CÂU LỆNH SQL: Thêm cột quantity
      const ins = await client.query(
        `INSERT INTO products (name, price, description, image_url, user_id, category_id, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          name,
          price,
          description,
          imageFilename,
          req.user.id,
          category_id,
          Number(quantity) || 1 // Lưu quantity, mặc định là 1 nếu thiếu
        ]
      );
      const post = ins.rows[0];

      // ... (Phần xử lý fee giữ nguyên)

      await client.query("COMMIT");
      return res.status(201).json({ ...toProduct(post) });
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("create product error:", e);
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

/* ======================= ✨ SELLER DASHBOARD ✨ ======================= */

/** 🧮 Thống kê tin đăng theo trạng thái */
router.get("/mine/stats", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT 
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE COALESCE(is_available, TRUE) = TRUE) AS active_count,
        COUNT(*) FILTER (WHERE COALESCE(is_available, FALSE) = FALSE) AS hidden_count,
        COUNT(*) FILTER (WHERE COALESCE(expires_at, NOW()) < NOW()) AS expired_count
      FROM products
      WHERE user_id = $1
      `,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error("mine stats error:", e);
    res.status(500).json({ error: "Server error: " + e.message });
  }
});

/** 🔁 Làm mới tin đăng (đẩy lên đầu) */
router.patch("/:id/refresh", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE products 
         SET updated_at = NOW()
       WHERE id=$1 AND user_id=$2`,
      [id, req.user.id]
    );
    res.json({ success: true, message: "Đã làm mới tin đăng" });
  } catch (e) {
    console.error("refresh:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/** ⏳ Gia hạn tin đăng thêm 7 ngày */
router.patch("/:id/extend", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE products
         SET expires_at = COALESCE(expires_at, NOW()) + interval '7 days'
       WHERE id=$1 AND user_id=$2`,
      [id, req.user.id]
    );
    res.json({ success: true, message: "Đã gia hạn tin thêm 7 ngày" });
  } catch (e) {
    console.error("extend:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/** 🗑️ Xóa tin đăng (dành cho người bán) */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM products WHERE id=$1 AND user_id=$2`, [
      id,
      req.user.id,
    ]);
    res.json({ success: true, message: "Đã xóa tin đăng" });
  } catch (e) {
    console.error("delete product:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/* =================== END SELLER DASHBOARD =================== */

/* =============== MY PRODUCTS (for MyPosts page) =============== */
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
       SELECT
        p.id,
        p.name,
        p.price,
        CASE 
          WHEN expires_at < NOW() THEN 'expired'
          WHEN COALESCE(p.is_available, TRUE) THEN 'active'
          ELSE 'hidden'
        END AS status,
        p.updated_at,
        p.created_at,
        p.image_url
      FROM products p
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      `,
      [req.user.id]
    );
    res.json(rows.map(toProduct));
  } catch (err) {
    console.error("GET /api/products/mine error:", err);
    res.status(500).json({ error: "Failed to fetch my products" });
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

/* =============== FEATURED =============== */
router.get("/featured", async (req, res) => {
  try {
    const lim = Math.min(20, Math.max(1, parseInt(req.query.limit || "10", 10)));

    // 👇 CẬP NHẬT QUERY NÀY
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.price, p.image_url, p.original_price, p.sold,
              (SELECT COUNT(*)::int FROM product_reviews r WHERE r.product_id = p.id) AS review_count,
              (SELECT COALESCE(AVG(r.rating), 0)::float FROM product_reviews r WHERE r.product_id = p.id) AS rating_avg
         FROM products p
        WHERE COALESCE(p.is_available, TRUE) = TRUE
        ORDER BY RANDOM()
        LIMIT $1`,
      [lim]
    );

    return res.json(rows.map(toProduct));
  } catch (e) {
    console.error("featured error:", e); // 👈 Xem lỗi chi tiết ở Terminal Backend nếu vẫn bị 500
    return res.status(500).json({ error: "Server error" });
  }
});
/* =============== LIST (pagination) =============== */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const offset = (page - 1) * limit;

    // Lấy thêm tham số sort
    const { category = "", q = "", sort = "newest" } = req.query;

    const conds = [];
    const params = [];
    let p = 1;

    // Filter Category
    if (category) {
      conds.push(`category_id = $${p++}`);
      params.push(Number(category));
    }

    // Filter Search
    if (q) {
      conds.push(`(LOWER(name) LIKE $${p} OR LOWER(description) LIKE $${p})`);
      params.push(`%${String(q).toLowerCase()}%`);
      p++;
    }

    // Filter chỉ hiện sản phẩm có sẵn (Optional - tùy logic của bạn)
    // conds.push(`COALESCE(is_available, TRUE) = TRUE`);

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    // 🔥 XỬ LÝ SẮP XẾP (SORT LOGIC)
    let orderBy = "p.created_at DESC"; // Mặc định: Mới nhất
    switch (sort) {
      case "price_asc":
        orderBy = "p.price ASC";
        break;
      case "price_desc":
        orderBy = "p.price DESC";
        break;
      case "popular":
        // Sắp xếp theo số lượng đã bán (sold) giảm dần
        orderBy = "p.sold DESC NULLS LAST";
        break;
      case "newest":
      default:
        orderBy = "p.created_at DESC";
        break;
    }

    const listSql = `
      SELECT p.*, 
             u.username AS seller_name, 
             u.phone AS seller_phone,
             (SELECT COUNT(*)::int FROM product_reviews r WHERE r.product_id = p.id) AS review_count,
             (SELECT COALESCE(AVG(r.rating), 0)::float FROM product_reviews r WHERE r.product_id = p.id) AS rating_avg
        FROM products p
   LEFT JOIN users u ON u.id = p.user_id
       ${where}
    ORDER BY ${orderBy} -- ✅ Thay thế order cứng bằng biến dynamic
       LIMIT $${p++} OFFSET $${p++}`;

    const countSql = `SELECT COUNT(*)::int AS total FROM products ${where}`;

    const [listRes, countRes] = await Promise.all([
      pool.query(listSql, [...params, limit, offset]),
      pool.query(countSql, params),
    ]);

    res.json({
      items: listRes.rows.map(toProduct),
      total: countRes.rows[0].total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(countRes.rows[0].total / limit)),
    });
  } catch (e) {
    console.error("list products:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/* =============== MY PRODUCTS (for MyPosts page) =============== */
/**
 * ⚠️ Đặt TRƯỚC route "/:id" để tránh bắt nhầm "mine" thành id.
 */
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
       SELECT
        p.id,
        p.name,
        p.price,
        CASE WHEN COALESCE(p.is_available, TRUE) THEN 'active' ELSE 'hidden' END AS status,
        p.created_at,
        p.image_url AS image_url
      FROM products p
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      `,
      [req.user.id]
    );
    res.json(rows.map(toProduct));
  } catch (err) {
    console.error("GET /api/products/mine error:", err);
    res.status(500).json({ error: "Failed to fetch my products" });
  }
});

/* =============== DETAIL =============== */
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, 
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
              u.id AS seller_id, u.username AS seller_name, u.phone AS seller_phone,
              (SELECT COUNT(*)::int FROM product_reviews r WHERE r.product_id = p.id) AS review_count,
              (SELECT COALESCE(AVG(r.rating), 0)::float FROM product_reviews r WHERE r.product_id = p.id) AS rating_avg
         FROM products p
         JOIN categories c ON p.category_id = c.id
         JOIN users u ON p.user_id = u.id
        WHERE p.id = $1`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    res.json(toProduct(rows[0]));
  } catch (err) {
    console.error("detail product:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =============== UPDATE / DELETE =============== */
router.put(
  "/:id",
  validateProductUpdate,
  authMiddleware,
  // 1. Đổi single('image') thành array('images')
  upload.array("images", 10),
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
        return res.status(403).json({ error: "Không có quyền sửa sản phẩm này" });
      }

      const {
        name,
        price,
        description,
        category_id,
        quantity,
        is_available,
        attributes,
      } = req.body;

      // 2. Sửa cách lấy file tương tự như POST
      let newImageFilename = null;
      if (req.files && req.files.length > 0) {
        newImageFilename = `products/${req.files[0].filename}`;
      }

      const { rows } = await pool.query(
        `UPDATE products
            SET name         = COALESCE($1, name),
                price        = COALESCE($2, price),
                description  = COALESCE($3, description),
                image_url    = COALESCE($4, image_url),
                category_id  = COALESCE($5, category_id),
                quantity     = COALESCE($6, quantity),
                is_available = COALESCE($7, is_available),
                attributes   = COALESCE($8::jsonb, attributes),
                updated_at   = NOW()
          WHERE id = $9 AND user_id = $10
        RETURNING *`,
        [
          name ?? null,
          price ?? null,
          description ?? null,
          newImageFilename ?? null,
          category_id ?? null,
          quantity ?? null,
          typeof is_available === "boolean" ? is_available : null,
          attributes ? JSON.stringify(attributes) : null,
          productId,
          userId,
        ]
      );
      res.json(toProduct(rows[0]));
    } catch (e) {
      console.error("update product:", e);
      res.status(500).json({ error: "Server error" });
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
      return res.status(403).json({ error: "Bạn không có quyền xóa sản phẩm này" });
    }

    await client.query(`DELETE FROM product_reviews WHERE product_id = $1`, [productId]);
    await client.query(`DELETE FROM order_items WHERE product_id = $1`, [productId]);
    await client.query(`DELETE FROM favorites WHERE product_id = $1`, [productId]);

    const del = await client.query(
      `DELETE FROM products WHERE id = $1 RETURNING image_url`,
      [productId]
    );

    await client.query("COMMIT");

    const filename = del.rows[0]?.image_url;
    if (filename) {
      const filePath = path.join(process.cwd(), "uploads", filename);
      import("fs").then(({ unlink }) => unlink(filePath, () => { }));
    }

    res.json({ ok: true, message: isAdmin ? "Đã xóa (admin)" : "Đã xóa" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("delete product:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    client.release();
  }
});

/* =============== RENEW (gia hạn tin) =============== */
router.post("/:id/renew", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `UPDATE products
         SET expires_at = NOW() + INTERVAL '30 days'
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ renewed: true });
  } catch (err) {
    console.error("POST /api/products/:id/renew error:", err);
    res.status(500).json({ error: "Failed to renew product" });
  }
});

// 🧠 AI giá gợi ý – dùng tên + category + (optional) giá mới
router.post("/price-suggest", async (req, res) => {
  try {
    let { name, category_id, original_price } = req.body || {};

    const qName = (name || "").trim();
    const catId = category_id ? Number(category_id) : null;
    const basePrice =
      typeof original_price !== "undefined" ? Number(original_price) : null;

    if (!qName && !catId) {
      return res.status(400).json({
        error: "Cần ít nhất tên sản phẩm hoặc category_id để gợi ý giá",
      });
    }

    const conds = [];
    const params = [];
    let p = 1;

    if (catId && !Number.isNaN(catId)) {
      conds.push(`p.category_id = $${p++}`);
      params.push(catId);
    }

    if (qName) {
      conds.push(`(p.name ILIKE $${p} OR p.description ILIKE $${p})`);
      params.push(`%${qName}%`);
      p++;
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const sql = `
      SELECT price
      FROM products p
      ${where}
      AND price IS NOT NULL
      ORDER BY p.created_at DESC
      LIMIT 200
    `;

    const r = await pool.query(sql, params);
    const prices = r.rows
      .map((row) => Number(row.price))
      .filter((v) => !Number.isNaN(v) && v > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      if (!basePrice || Number.isNaN(basePrice)) {
        return res.json({
          hasData: false,
          suggestedPrice: null,
          minPrice: null,
          maxPrice: null,
          sampleSize: 0,
          message: "Chưa có dữ liệu sản phẩm tương tự trong hệ thống.",
        });
      }

      const low = Math.round(basePrice * 0.4);
      const high = Math.round(basePrice * 0.7);
      const mid = Math.round((low + high) / 2);

      return res.json({
        hasData: false,
        suggestedPrice: mid,
        minPrice: low,
        maxPrice: high,
        sampleSize: 0,
        message: "Gợi ý theo tỉ lệ 40–70% giá mới.",
      });
    }

    const n = prices.length;
    const minPrice = prices[0];
    const maxPrice = prices[n - 1];
    const p25 = prices[Math.floor(n * 0.25)];
    const p75 = prices[Math.floor(n * 0.75)];
    const median =
      n % 2
        ? prices[(n - 1) / 2]
        : (prices[n / 2 - 1] + prices[n / 2]) / 2;

    let suggested = median;
    if (basePrice && !Number.isNaN(basePrice)) {
      suggested = Math.round(median * 0.7 + basePrice * 0.3);
    } else {
      suggested = Math.round(median);
    }

    return res.json({
      hasData: true,
      suggestedPrice: suggested,
      minPrice: p25 || minPrice,
      maxPrice: p75 || maxPrice,
      sampleSize: n,
      message: "Gợi ý dựa trên các sản phẩm tương tự đã đăng.",
    });
  } catch (e) {
    console.error("price-suggest:", e);
    res.status(500).json({ error: "Không thể gợi ý giá lúc này" });
  }
});

// 🧠 AI dò giá "thị trường" theo title + category, dùng dữ liệu thật + template từ khoá
router.post("/price-from-market", async (req, res) => {
  try {
    let { title, category_id, original_price } = req.body || {};

    const rawTitle = String(title || "");
    const qTitle = rawTitle.trim().toLowerCase();
    const catId = category_id ? Number(category_id) : null;
    const basePrice =
      typeof original_price !== "undefined" && original_price !== null
        ? Number(original_price)
        : null;

    if (!qTitle && !catId) {
      return res.status(400).json({
        error: "Cần ít nhất tiêu đề hoặc category_id để dò giá thị trường",
      });
    }

    // Helper: tính min / max / median
    const computeStats = (rows) => {
      const arr = rows
        .map((x) => Number(x.price))
        .filter((v) => v > 0)
        .sort((a, b) => a - b);
      if (!arr.length) return null;
      const n = arr.length;
      const min = arr[0];
      const max = arr[n - 1];
      const median =
        n % 2 ? arr[(n - 1) / 2] : (arr[n / 2 - 1] + arr[n / 2]) / 2;
      return { min, max, median, count: n };
    };

    const conds = [];
    const params = [];
    let p = 1;

    if (catId && !Number.isNaN(catId)) {
      conds.push(`p.category_id = $${p++}`);
      params.push(catId);
    }

    // Tách keyword theo từng từ đơn (>=3 ký tự) để search DB
    const words = qTitle.split(" ").filter((w) => w.length >= 3);

    if (words.length) {
      const likeClauses = words.map((w) => {
        params.push(`%${w}%`);
        const id = params.length;
        return `(p.name ILIKE $${id} OR p.description ILIKE $${id})`;
      });
      conds.push("(" + likeClauses.join(" OR ") + ")");
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    // 1) Thử tìm theo keyword + category (nếu có) trong DB
    let stats = null;
    if (where) {
      const sqlKeyword = `
        SELECT price
        FROM products p
        ${where}
        AND price IS NOT NULL
        ORDER BY p.created_at DESC
        LIMIT 300
      `;
      const r = await pool.query(sqlKeyword, params);
      stats = computeStats(r.rows);
      if (stats) {
        return res.json({
          hasData: true,
          suggestedPrice: Math.round(stats.median),
          minPrice: stats.min,
          maxPrice: stats.max,
          sampleSize: stats.count,
          source: ["Dữ liệu sản phẩm tương tự trong hệ thống"],
          message:
            "AI gợi ý từ các sản phẩm có tiêu đề / mô tả hoặc danh mục tương tự đã được đăng.",
        });
      }
    }

    // 2) Nếu không có kết quả, mà có category -> dùng mặt bằng giá trong category đó
    if (!stats && catId && !Number.isNaN(catId)) {
      const rCat = await pool.query(
        `
        SELECT price
        FROM products
        WHERE category_id = $1
          AND price IS NOT NULL
        LIMIT 300
      `,
        [catId]
      );
      stats = computeStats(rCat.rows);
      if (stats) {
        return res.json({
          hasData: true,
          suggestedPrice: Math.round(stats.median),
          minPrice: stats.min,
          maxPrice: stats.max,
          sampleSize: stats.count,
          source: ["Toàn bộ sản phẩm trong cùng danh mục"],
          message:
            "Không tìm thấy sản phẩm trùng từ khoá, AI dùng mặt bằng giá trong danh mục này để gợi ý.",
        });
      }
    }

    // 3) Nếu vẫn không có dữ liệu trong DB -> fallback theo TEMPLATE từ khoá
    //    Ví dụ: "macbook" -> laptop, "giày nike" -> giày thể thao...
    const TEMPLATES = [
      {
        id: "laptop",
        label: "Laptop / Macbook",
        min: 10000000,
        max: 25000000,
        keywords: ["macbook", "laptop", "asus", "dell", "lenovo", "hp"],
      },
      {
        id: "shoe",
        label: "Giày thể thao / sneaker",
        min: 100000,
        max: 800000,
        keywords: ["giày", "giay", "sneaker", "nike", "adidas", "vans", "converse"],
      },
      {
        id: "balo",
        label: "Balo / túi xách sinh viên",
        min: 50000,
        max: 250000,
        keywords: ["balo", "ba lô", "túi xách", "tui xach"],
      },
      {
        id: "book",
        label: "Sách / giáo trình",
        min: 20000,
        max: 120000,
        keywords: ["sách", "sach", "giáo trình", "giao trinh", "giáo khoa"],
      },
      {
        id: "clothes",
        label: "Áo quần / hoodie",
        min: 80000,
        max: 400000,
        keywords: ["hoodie", "áo khoác", "ao khoac", "áo thun", "ao thun"],
      },
      {
        id: "accessory",
        label: "Phụ kiện cá nhân (đồng hồ, kính, ...)",
        min: 50000,
        max: 600000,
        keywords: ["đồng hồ", "dong ho", "kính", "kinh mat", "vòng tay", "nhẫn"],
      },
      {
        id: "fan",
        label: "Quạt / đồ điện nhỏ",
        min: 60000,
        max: 400000,
        keywords: ["quạt", "quat mini", "quat ban", "quat điều hoà", "quat dieu hoa"],
      },
      {
        id: "desk",
        label: "Bàn ghế / kệ sách nhỏ",
        min: 100000,
        max: 800000,
        keywords: ["bàn học", "ban hoc", "ghế", "ghe", "kệ sách", "ke sach"],
      },
    ];

    let matchedTemplate = null;
    for (const tpl of TEMPLATES) {
      if (tpl.keywords.some((k) => qTitle.includes(k))) {
        matchedTemplate = tpl;
        break;
      }
    }

    if (matchedTemplate) {
      const { min, max, label } = matchedTemplate;
      const tplMid = (min + max) / 2;
      const suggested = basePrice && basePrice > 0
        ? Math.round((tplMid + basePrice) / 2) // trung bình giữa giá mẫu & giá user nhập
        : Math.round(tplMid);

      return res.json({
        hasData: false, // dùng template, không phải data thật
        suggestedPrice: suggested,
        minPrice: min,
        maxPrice: max,
        sampleSize: 0,
        source: [`Nhóm sản phẩm: ${label}`],
        message:
          "AI suy luận loại sản phẩm từ tiêu đề và gợi ý khoảng giá tham khảo cho nhóm hàng này.",
      });
    }

    // 4) Không match template, nhưng user có nhập giá mới -> ±20% quanh giá đó
    if (basePrice && basePrice > 0) {
      const low = Math.round(basePrice * 0.8);
      const high = Math.round(basePrice * 1.2);
      const mid = Math.round((low + high) / 2);

      return res.json({
        hasData: false,
        suggestedPrice: mid,
        minPrice: low,
        maxPrice: high,
        sampleSize: 0,
        source: ["Giá bạn nhập"],
        message:
          "Chưa có dữ liệu hoặc mẫu phù hợp, AI gợi ý khoảng ±20% quanh giá bạn nhập.",
      });
    }

    // 5) Hoàn toàn không có dữ liệu & bạn cũng không nhập giá
    return res.json({
      hasData: false,
      suggestedPrice: null,
      minPrice: null,
      maxPrice: null,
      sampleSize: 0,
      source: [],
      message:
        "Hiện chưa có dữ liệu thị trường phù hợp. Bạn có thể tham khảo gợi ý từ UniTrade hoặc tự đặt giá.",
    });
  } catch (err) {
    console.error("price-from-market:", err);
    res.status(500).json({ error: "Không thể lấy giá thị trường" });
  }
});

// 📊 Thống kê giá theo lịch sử đơn hàng của category sản phẩm
router.get("/:id/price-range", async (req, res) => {
  try {
    const months = Math.max(
      1,
      Math.min(12, parseInt(req.query.months || "3", 10))
    );

    const one = await pool.query(
      `SELECT category_id FROM products WHERE id=$1`,
      [req.params.id]
    );
    if (!one.rowCount)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });

    const catId = one.rows[0].category_id;

    const q = await pool.query(
      `
      SELECT oi.price
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE p.category_id = $1
        AND o.status IN ('paid', 'completed')
        AND o.created_at >= NOW() - ($2 || ' months')::interval
      `,
      [catId, months]
    );

    const prices = q.rows
      .map((x) => Number(x.price || 0))
      .filter((v) => v > 0)
      .sort((a, b) => a - b);

    if (!prices.length)
      return res.json({ min: 0, max: 0, median: 0, count: 0 });

    const min = prices[0];
    const max = prices[prices.length - 1];
    const median = prices[Math.floor(prices.length / 2)];

    res.json({ min, max, median, count: prices.length });
  } catch (e) {
    console.error("price-range:", e);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;
