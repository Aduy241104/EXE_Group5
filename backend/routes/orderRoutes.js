import { Router } from "express";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Helper xử lý ảnh (để đồng bộ đường dẫn ảnh trả về cho frontend)
const ABS = process.env.BASE_URL || "http://localhost:5000";
const normalizeImg = (f) => {
  if (!f) return null;
  if (f.startsWith("http")) return f;
  const clean = f.replace(/^\/+/, "");
  return `${ABS}/${clean.startsWith("uploads/") ? clean : `uploads/${clean}`}`;
};

/* ----------------------------------------------------------------
   1. TẠO ĐƠN HÀNG (Lite Order)
   - Trạng thái mặc định: 'pending'
---------------------------------------------------------------- */
router.post("/", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { product_id, quantity } = req.body;
    const buyerId = req.user.id;
    const buyQty = Number(quantity) || 1;

    await client.query("BEGIN");

    // 1. Kiểm tra sản phẩm & Tồn kho
    const pRes = await client.query(
      "SELECT price, user_id, name, quantity, is_available FROM products WHERE id = $1",
      [product_id]
    );

    if (pRes.rowCount === 0) throw new Error("Sản phẩm không tồn tại");
    const product = pRes.rows[0];

    if (product.user_id === buyerId) throw new Error("Không thể tự mua hàng của mình");
    if (product.quantity < buyQty) throw new Error(`Kho chỉ còn ${product.quantity} sản phẩm`);
    if (product.is_available === false) throw new Error("Sản phẩm đang tạm ngưng bán");

    const total = Number(product.price) * buyQty;

    // 2. Tạo Order
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, 'pending') RETURNING id`,
      [buyerId, total]
    );
    const orderId = orderRes.rows[0].id;

    // 3. Tạo Order Item
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
      [orderId, product_id, buyQty, product.price]
    );

    await client.query("COMMIT");
    res.json({ order: { id: orderId }, message: "Đã gửi yêu cầu mua hàng!" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: err.message || "Lỗi tạo đơn" });
  } finally {
    client.release();
  }
});

/* ----------------------------------------------------------------
   2. CẬP NHẬT TRẠNG THÁI (Core Logic)
   - pending -> shipping (Seller xác nhận)
   - shipping -> completed (Buyer xác nhận -> Trừ kho, cộng sold)
   - cancelled (Cả 2 hủy)
---------------------------------------------------------------- */
router.patch("/:id/status", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    await client.query("BEGIN");

    // Lấy thông tin đơn + seller_id từ product
    const orderCheck = await client.query(
      `SELECT o.*, p.user_id as seller_id 
       FROM orders o 
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Đơn không tồn tại" });
    }
    const order = orderCheck.rows[0];

    // --- PHÂN QUYỀN ---

    // Seller: pending -> shipping
    if (status === 'shipping') {
      if (order.seller_id !== userId) throw new Error("Chỉ người bán mới được xác nhận đơn");
    }

    // Buyer: shipping -> completed
    else if (status === 'completed') {
      if (order.user_id !== userId) throw new Error("Chỉ người mua mới được xác nhận đã nhận hàng");
      if (order.status !== 'shipping') throw new Error("Đơn hàng chưa được người bán xác nhận giao đi");
    }

    // Cancelled
    else if (status === 'cancelled') {
      if (order.user_id !== userId && order.seller_id !== userId) {
        throw new Error("Bạn không có quyền hủy đơn này");
      }
      if (order.status === 'completed') throw new Error("Đơn hàng đã hoàn tất, không thể hủy");
    }
    else {
      throw new Error("Trạng thái không hợp lệ");
    }

    // Cập nhật bảng orders
    const result = await client.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    // 🔥 FIX LỖI AMBIGUOUS: Cập nhật số lượng đã bán và tồn kho
    if (status === 'completed') {
      await client.query(
        `UPDATE products 
         SET sold = COALESCE(sold, 0) + oi.quantity,
             quantity = GREATEST(0, products.quantity - oi.quantity) -- 👈 Đã thêm products.quantity
         FROM order_items oi
         WHERE products.id = oi.product_id AND oi.order_id = $1`,
        [id]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ message: err.message || "Lỗi server" });
  } finally {
    client.release();
  }
});

/* ----------------------------------------------------------------
   3. LẤY ĐƠN HÀNG CỦA NGƯỜI MUA (Buyer)
---------------------------------------------------------------- */
router.get("/buyer", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at,
              p.id as product_id, p.name as product_name, p.image_url,
              u.username as seller_name
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    const normalized = rows.map(r => ({ ...r, image_url: normalizeImg(r.image_url) }));
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách đơn mua" });
  }
});

/* ----------------------------------------------------------------
   4. LẤY ĐƠN HÀNG CỦA NGƯỜI BÁN (Seller)
---------------------------------------------------------------- */
router.get("/seller", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at,
              p.id as product_id, p.name as product_name, p.image_url,
              u.username as buyer_name, u.phone as buyer_phone
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       JOIN users u ON o.user_id = u.id
       WHERE p.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    const normalized = rows.map(r => ({ ...r, image_url: normalizeImg(r.image_url) }));
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách đơn bán" });
  }
});

export default router;