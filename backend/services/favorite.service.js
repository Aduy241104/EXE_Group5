// services/favorite.service.js
import pool from "../models/db.js";
import { toProduct } from "./product.service.js";

// Kiểm tra sản phẩm có nằm trong yêu thích?
export async function isFavorite(userId, productId) {
    const r = await pool.query(
        `SELECT 1 FROM favorites WHERE user_id=$1 AND product_id=$2`,
        [userId, productId]
    );
    return r.rowCount > 0;
}

// Toggle Favorite: nếu đã thích → xóa, chưa thích → thêm
export async function toggleFavorite(userId, productId) {
    if (await isFavorite(userId, productId)) {
        await pool.query(
            `DELETE FROM favorites WHERE user_id=$1 AND product_id=$2`,
            [userId, productId]
        );
        return { isFavorite: false };
    }

    await pool.query(
        `INSERT INTO favorites (user_id, product_id)
     VALUES ($1,$2)
     ON CONFLICT DO NOTHING`,
        [userId, productId]
    );
    return { isFavorite: true };
}

// Lấy danh sách yêu thích
export async function getFavorites(userId) {
    const r = await pool.query(
        `SELECT p.id, p.name, p.price, p.description, p.image_url, p.created_at,
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
            u.username AS seller_name, u.phone AS seller_phone
     FROM favorites f
     JOIN products p ON p.id = f.product_id
     JOIN categories c ON c.id = p.category_id
     JOIN users u ON u.id = p.user_id
     WHERE f.user_id=$1
     ORDER BY f.created_at DESC`,
        [userId]
    );

    return r.rows.map(toProduct);
}
