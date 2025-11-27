import pool from "../models/db.js";

const getImageUrl = (filename) => {
  if (!filename) return null;
  return `${process.env.BASE_URL || "http://localhost:5000"
    }/uploads/${filename}`;
};

// 🟠 Tạo sản phẩm mới
export const createProduct = async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    const image_url = req.file ? req.file.filename : null;
    const userId = req.user.id;

    const newProduct = await pool.query(
      `INSERT INTO products (name, price, description, image_url, category_id, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, price, description, image_url, category, userId]
    );

    const row = newProduct.rows[0];
    res.json({
      ...row,
      image_url: getImageUrl(row.image_url),
    });
  } catch (err) {
    console.error("❌ Error creating product:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟠 Lấy danh sách sản phẩm (có lọc, search, phân trang)
export const getProducts = async (req, res) => {
  try {
    let {
      category,
      q,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    // Chuẩn hoá số
    page = Number(page) || 1;
    limit = Number(limit) || 20;
    if (limit > 50) limit = 50;
    if (page < 1) page = 1;

    const params = [];
    const conditions = [];
    let idx = 1;

    // 🔹 Lọc theo category_id (số)
    if (category) {
      const catId = Number(category);
      if (!Number.isNaN(catId)) {
        conditions.push(`p.category_id = $${idx}`);
        params.push(catId);
        idx++;
      }
    }

    // 🔹 Tìm kiếm theo tên / mô tả
    if (q && q.trim()) {
      conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx})`);
      params.push(`%${q.trim()}%`);
      idx++;
    }

    // 🔹 Lọc khoảng giá
    if (minPrice) {
      conditions.push(`p.price >= $${idx}`);
      params.push(Number(minPrice));
      idx++;
    }
    if (maxPrice) {
      conditions.push(`p.price <= $${idx}`);
      params.push(Number(maxPrice));
      idx++;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // 🔹 Sắp xếp
    let orderBy = "p.created_at DESC";
    switch (sort) {
      case "price_asc":
        orderBy = "p.price ASC";
        break;
      case "price_desc":
        orderBy = "p.price DESC";
        break;
      case "random":
        orderBy = "RANDOM()";
        break;
      case "newest":
      default:
        orderBy = "p.created_at DESC";
    }

    const offset = (page - 1) * limit;

    // 🔹 Query chính lấy sản phẩm
    const listQuery = `
      SELECT p.*, u.username AS seller_name, u.phone AS seller_phone
      FROM products p
      JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const listParams = [...params, limit, offset];

    const result = await pool.query(listQuery, listParams);
    const products = result.rows;

    // 🔹 Đếm tổng
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM products p
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = Number(countResult.rows[0]?.total || 0);

    // 🔹 Favorites của user (nếu có)
    let favoriteIds = new Set();
    if (req.user && req.user.id) {
      const favRes = await pool.query(
        "SELECT product_id FROM favorites WHERE user_id = $1",
        [req.user.id]
      );
      favoriteIds = new Set(favRes.rows.map((f) => f.product_id));
    }

    const items = products.map((p) => ({
      ...p,
      image_url: getImageUrl(p.image_url),
      isFavorite: favoriteIds.has(p.id),
    }));

    return res.json({
      items,
      page,
      limit,
      total,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy sản phẩm:", err.message);
    res.status(500).json({ error: "Lỗi server khi lấy sản phẩm" });
  }
};

// 🟠 Lấy danh sách sản phẩm do user đã đăng
export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT p.*, 
              CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS "isFavorite"
       FROM products p
       LEFT JOIN favorites f 
         ON p.id = f.product_id AND f.user_id = $1
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    const products = result.rows.map((p) => ({
      ...p,
      image_url: getImageUrl(p.image_url),
    }));

    res.json(products);
  } catch (err) {
    console.error("❌ Lỗi khi lấy myposts:", err);
    res.status(500).json({ error: "Không thể lấy tin đã đăng" });
  }
};

// 🟠 Cập nhật sản phẩm
export const updateProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const { name, price, description, category_id } = req.body;
    const newImage = req.file ? req.file.filename : null;

    const check = await pool.query(
      "SELECT id, user_id FROM products WHERE id = $1",
      [productId]
    );
    if (check.rowCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    if (check.rows[0].user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa sản phẩm này" });
    }

    const { rows } = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           description = COALESCE($3, description),
           image_url = COALESCE($4, image_url),
           category_id = COALESCE($5, category_id)
       WHERE id = $6
       RETURNING *`,
      [
        name ?? null,
        price ?? null,
        description ?? null,
        newImage ?? null,
        category_id ?? null,
        productId,
      ]
    );

    const row = rows[0];
    res.json({ ...row, image_url: getImageUrl(row.image_url) });
  } catch (err) {
    console.error("❌ updateProduct error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🧩 Lấy danh sách tin đăng của người bán
export const getMyProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT id, title, price, status, updated_at, expires_at
       FROM products
       WHERE seller_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getMyProducts error:", err.message);
    res.status(500).json({ error: "Không thể lấy danh sách tin" });
  }
};

// 📊 Thống kê tin đăng theo trạng thái
export const getMyProductsStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT 
          COUNT(*) FILTER (WHERE status='active') AS active_count,
          COUNT(*) FILTER (WHERE status='expired') AS expired_count,
          COUNT(*) AS total_count
       FROM products
       WHERE seller_id=$1`,
      [userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("getMyProductsStats error:", err.message);
    res.status(500).json({ error: "Không thể thống kê tin" });
  }
};

// 🔁 Làm mới tin (đẩy lên đầu danh sách)
export const refreshProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await pool.query(
      `UPDATE products SET updated_at = NOW()
       WHERE id = $1 AND seller_id = $2`,
      [id, userId]
    );
    res.json({ success: true, message: "Đã làm mới tin đăng" });
  } catch (err) {
    console.error("refreshProduct error:", err.message);
    res.status(500).json({ error: "Không thể làm mới tin" });
  }
};

// ⏳ Gia hạn tin thêm 7 ngày
export const extendProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await pool.query(
      `UPDATE products 
       SET expires_at = COALESCE(expires_at, NOW()) + interval '7 days'
       WHERE id = $1 AND seller_id = $2`,
      [id, userId]
    );
    res.json({ success: true, message: "Đã gia hạn tin thêm 7 ngày" });
  } catch (err) {
    console.error("extendProduct error:", err.message);
    res.status(500).json({ error: "Không thể gia hạn tin" });
  }
};

// 🗑️ Xóa tin đăng
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await pool.query(`DELETE FROM products WHERE id=$1 AND seller_id=$2`, [
      id,
      userId,
    ]);
    res.json({ success: true, message: "Đã xóa tin đăng" });
  } catch (err) {
    console.error("deleteProduct error:", err.message);
    res.status(500).json({ error: "Không thể xóa tin" });
  }
};

// 🧠 AI gợi ý giá bán cho sản phẩm (MVP)
export const suggestPrice = async (req, res) => {
  try {
    let { name, category_id, original_price } = req.body;

    if (!name && !category_id) {
      return res.status(400).json({
        error: "Cần ít nhất tên sản phẩm hoặc category_id để gợi ý giá",
      });
    }

    // Chuẩn hoá input
    const q = (name || "").trim();
    const catId = category_id ? Number(category_id) : null;
    const originalPrice = original_price ? Number(original_price) : null;

    const params = [];
    const conditions = [];
    let idx = 1;

    // Lọc theo category nếu có
    if (catId && !Number.isNaN(catId)) {
      conditions.push(`p.category_id = $${idx}`);
      params.push(catId);
      idx++;
    }

    // Lọc theo tên gần giống (ILIKE)
    if (q) {
      conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    // Có thể chỉ lấy sản phẩm còn "active" nếu bạn có cột status
    // conditions.push(`p.status = 'active'`);

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Lấy tối đa 200 sản phẩm tương tự để thống kê
    const sql = `
      SELECT price
      FROM products p
      ${whereClause}
      AND price IS NOT NULL
      ORDER BY p.created_at DESC
      LIMIT 200
    `;

    const result = await pool.query(sql, params);
    const prices = result.rows.map((r) => Number(r.price)).filter((n) => !Number.isNaN(n));

    // Nếu không có dữ liệu tương tự trong DB
    if (!prices.length) {
      if (!originalPrice || Number.isNaN(originalPrice)) {
        return res.status(200).json({
          hasData: false,
          message:
            "Chưa có đủ dữ liệu sản phẩm tương tự để gợi ý. Bạn có thể đặt giá theo kinh nghiệm hoặc tham khảo bạn bè.",
        });
      }

      // MVP fallback: đề xuất khoảng 40–70% giá gốc
      const low = Math.round(originalPrice * 0.4);
      const high = Math.round(originalPrice * 0.7);
      const suggested = Math.round((low + high) / 2);

      return res.status(200).json({
        hasData: false,
        suggestedPrice: suggested,
        minPrice: low,
        maxPrice: high,
        sampleSize: 0,
        message:
          "Gợi ý tạm dựa trên tỉ lệ so với giá mới, do chưa có dữ liệu sản phẩm tương tự trong hệ thống.",
      });
    }

    // Có dữ liệu thực → tính toán "thông minh"
    prices.sort((a, b) => a - b);
    const n = prices.length;

    const minPrice = prices[0];
    const maxPrice = prices[n - 1];

    const median = (arr) => {
      const m = arr.length;
      if (m % 2 === 1) return arr[(m - 1) / 2];
      return (arr[m / 2 - 1] + arr[m / 2]) / 2;
    };

    const p25 = prices[Math.floor(n * 0.25)];
    const p75 = prices[Math.floor(n * 0.75)];
    const med = median(prices);

    // Đề xuất giá chính: median, nhưng có thể “kéo nhẹ” về phía giá gốc nếu có
    let suggested = med;
    if (originalPrice && !Number.isNaN(originalPrice)) {
      const mix = med * 0.7 + originalPrice * 0.3;
      suggested = Math.round(mix);
    } else {
      suggested = Math.round(med);
    }

    return res.status(200).json({
      hasData: true,
      suggestedPrice: suggested,
      minPrice: p25 || minPrice,
      maxPrice: p75 || maxPrice,
      sampleSize: n,
      message:
        "Khoảng giá được gợi ý dựa trên các sản phẩm tương tự đã được đăng bởi sinh viên khác.",
    });
  } catch (err) {
    console.error("suggestPrice error:", err);
    res.status(500).json({ error: "Không thể gợi ý giá lúc này" });
  }
};
