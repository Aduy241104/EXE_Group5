// services/product.service.js
// ===============================================
// Product Service — xử lý toàn bộ truy vấn database
// Giữ nguyên toàn bộ logic từ productRoutes.js
// nhưng tách ra clean, dễ bảo trì
// ===============================================

import pool from "../models/db.js";

// Chuẩn hóa ảnh trả về
const ABS = process.env.BASE_URL || "http://localhost:5000";
export const formatImage = (filename) => {
    if (!filename) return null;
    let raw = String(filename).replace(/\\/g, "/");
    raw = raw.replace(/^\/?uploads\//i, "");
    if (!/^[^/]+\/[^/]+/.test(raw)) raw = `products/${raw}`;
    return `${ABS}/uploads/${raw}`;
};

// Chuyển product row → đối tượng có image_url đầy đủ
export const toProduct = (row) => ({
    ...row,
    image_url: formatImage(row.image_url),
});

// ===============================================
// 1) Tạo sản phẩm (transaction + fee)
// ===============================================
export const createProductWithFee = async ({
    name,
    price,
    description,
    category_id,
    userId,
    imageFilename,
    voucher_code,
}) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const ins = await client.query(
            `INSERT INTO products (name, price, description, image_url, user_id, category_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
            [name, price, description, imageFilename, userId, category_id]
        );
        const product = ins.rows[0];

        // Sau này tách file feeService; tạm dùng như route cũ
        let fee = 0;
        if (voucher_code) {
            const { redeemAfterCreatePost } = await import("./feeService.js");
            const r = await redeemAfterCreatePost({
                client,
                sellerId: userId,
                categoryId: category_id,
                voucherCode: voucher_code.trim(),
                postId: product.id,
            });
            fee = r.fee;
        }

        await client.query("COMMIT");
        return { product: toProduct(product), fee };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

// ===============================================
// 2) Pagination list products
// ===============================================
export const listProducts = async ({ page, limit, category, q }) => {
    page = Math.max(1, parseInt(page || "1", 10));
    limit = Math.min(50, Math.max(1, parseInt(limit || "20", 10)));
    const offset = (page - 1) * limit;

    const conds = [];
    const params = [];
    let i = 1;

    if (category) {
        conds.push(`category_id = $${i++}`);
        params.push(Number(category));
    }
    if (q) {
        conds.push(`(LOWER(name) LIKE $${i} OR LOWER(description) LIKE $${i})`);
        params.push(`%${String(q).toLowerCase()}%`);
        i++;
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const listSql = `
    SELECT p.*, u.username AS seller_name, u.phone AS seller_phone
    FROM products p
    LEFT JOIN users u ON u.id = p.user_id
    ${where}
    ORDER BY p.updated_at DESC
    LIMIT $${i++} OFFSET $${i}
  `;
    const countSql = `SELECT COUNT(*)::int AS total FROM products ${where}`;

    const [listRes, countRes] = await Promise.all([
        pool.query(listSql, [...params, limit, offset]),
        pool.query(countSql, params),
    ]);

    return {
        items: listRes.rows.map(toProduct),
        total: countRes.rows[0].total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(countRes.rows[0].total / limit)),
    };
};

// ===============================================
// 3) Search Autocomplete
// ===============================================
export const searchProducts = async (keyword) => {
    const q = String(keyword || "").toLowerCase();
    const r = await pool.query(
        `SELECT id, name, price, image_url
     FROM products
     WHERE LOWER(name) LIKE $1
     LIMIT 10`,
        [`%${q}%`]
    );
    return r.rows.map(toProduct);
};

// ===============================================
// 4) Lấy Product Detail
// ===============================================
export const getProductById = async (id) => {
    const r = await pool.query(
        `SELECT p.*, 
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
            u.id AS seller_id, u.username AS seller_name, u.phone AS seller_phone
     FROM products p
     JOIN categories c ON p.category_id = c.id
     JOIN users u ON p.user_id = u.id
     WHERE p.id = $1`,
        [id]
    );

    if (!r.rows.length) return null;
    return toProduct(r.rows[0]);
};

// ===============================================
// 5) Update product
// ===============================================
export const updateProduct = async ({
    id,
    userId,
    fields,
    newImageFilename,
}) => {
    const check = await pool.query(
        `SELECT id, user_id FROM products WHERE id = $1`,
        [id]
    );
    if (!check.rowCount) return { notFound: true };
    if (Number(check.rows[0].user_id) !== Number(userId))
        return { forbidden: true };

    const {
        name,
        price,
        description,
        category_id,
        quantity,
        is_available,
        attributes,
    } = fields;

    const r = await pool.query(
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
            id,
            userId,
        ]
    );

    return { updated: toProduct(r.rows[0]) };
};

// ===============================================
// 6) Delete product + cascade remove references
// ===============================================
export const deleteProduct = async ({ id, userId, role }) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const pre = await client.query(
            `SELECT id, user_id, image_url FROM products WHERE id=$1`,
            [id]
        );
        if (!pre.rowCount)
            return { notFound: true };

        const ownerId = pre.rows[0].user_id;
        const isAdmin = (role || "").toLowerCase() === "admin";

        if (!isAdmin && Number(ownerId) !== Number(userId))
            return { forbidden: true };

        await client.query(`DELETE FROM product_reviews WHERE product_id=$1`, [id]);
        await client.query(`DELETE FROM order_items WHERE product_id=$1`, [id]);
        await client.query(`DELETE FROM favorites WHERE product_id=$1`, [id]);

        const del = await client.query(
            `DELETE FROM products WHERE id=$1 RETURNING image_url`,
            [id]
        );

        await client.query("COMMIT");

        return {
            deleted: true,
            image: del.rows[0]?.image_url || null,
            adminDeleted: isAdmin,
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

// ===============================================
// 7) Featured products
// ===============================================
export const getFeatured = async (limit = 10) => {
    const r = await pool.query(
        `SELECT id, name, price, image_url
     FROM products
     WHERE COALESCE(is_available, TRUE) = TRUE
     ORDER BY RANDOM()
     LIMIT $1`,
        [limit]
    );
    return r.rows.map(toProduct);
};

// ===============================================
// 8) My posts
// ===============================================
export const getMyProducts = async (userId) => {
    const r = await pool.query(
        `SELECT p.id, p.name, p.price,
            CASE 
              WHEN expires_at < NOW() THEN 'expired'
              WHEN COALESCE(p.is_available, TRUE) THEN 'active'
              ELSE 'hidden'
            END AS status,
            p.updated_at, p.created_at, p.image_url
     FROM products p
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC`,
        [userId]
    );
    return r.rows.map(toProduct);
};

// ===============================================
// 9) Dashboard stats
// ===============================================
export const getMyStats = async (userId) => {
    const r = await pool.query(
        `
    SELECT 
      COUNT(*) AS total_count,
      COUNT(*) FILTER (WHERE COALESCE(is_available, TRUE) = TRUE) AS active_count,
      COUNT(*) FILTER (WHERE COALESCE(is_available, FALSE) = FALSE) AS hidden_count,
      COUNT(*) FILTER (WHERE COALESCE(expires_at, NOW()) < NOW()) AS expired_count
    FROM products
    WHERE user_id=$1
  `,
        [userId]
    );
    return r.rows[0];
};

// ===============================================
// 10) Refresh / Extend / Renew
// ===============================================
export const refreshProduct = async (id, userId) => {
    await pool.query(
        `UPDATE products SET updated_at=NOW() WHERE id=$1 AND user_id=$2`,
        [id, userId]
    );
};

export const extendProduct = async (id, userId) => {
    await pool.query(
        `UPDATE products
     SET expires_at = COALESCE(expires_at, NOW()) + interval '7 days'
     WHERE id=$1 AND user_id=$2`,
        [id, userId]
    );
};

export const renewProduct = async (id, userId) => {
    await pool.query(
        `UPDATE products
     SET expires_at = NOW() + INTERVAL '30 days'
     WHERE id=$1 AND user_id=$2`,
        [id, userId]
    );
};

// ===============================================
// 11) Count my posts
// ===============================================
export const countMyPosts = async (userId) => {
    const r = await pool.query(
        `SELECT COUNT(*)::int AS count FROM products WHERE user_id=$1`,
        [userId]
    );
    return r.rows[0].count;
};
