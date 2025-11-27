// backend/routes/userRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/** PUT /api/users/profile */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, phone, address, name, school, student_id, age } = req.body;

    const { rows } = await pool.query(
      `UPDATE users
         SET username = COALESCE($1, username),
             phone    = COALESCE($2, phone),
             address  = COALESCE($3, address),
             name     = COALESCE($4, name),
             school   = COALESCE($5, school),
             student_id = COALESCE($6, student_id),
             age      = COALESCE($7, age)
       WHERE id=$8
       RETURNING id, username, email, phone, address, name, school, student_id, age, avatar_url, role`,
      [username ?? name ?? null, phone ?? null, address ?? null, name ?? null, school ?? null, student_id ?? null, age ?? null, userId]
    );

    res.json({ user: rows[0] });
  } catch (err) {
    console.error("users/profile:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/** PUT /api/users/password */
router.put("/password", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const oldPassword = req.body.oldPassword ?? req.body.old_password;
    const newPassword = req.body.newPassword ?? req.body.new_password;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Thiếu oldPassword/newPassword" });
    }

    const r = await pool.query("SELECT password FROM users WHERE id=$1", [userId]);
    if (!r.rowCount) return res.status(404).json({ error: "Không tìm thấy user" });

    const ok = await bcrypt.compare(oldPassword, r.rows[0].password);
    if (!ok) return res.status(400).json({ error: "Mật khẩu cũ không đúng" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashed, userId]);

    res.json({ ok: true });
  } catch (err) {
    console.error("users/password:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/** PUT /api/users/avatar  (field: 'avatar') */
router.put("/avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Thiếu file avatar" });
    const rel = `uploads/${req.file.filename}`;
    await pool.query("UPDATE users SET avatar_url=$1 WHERE id=$2", [rel, req.user.id]);

    const { rows } = await pool.query(
      "SELECT id, username, email, phone, address, avatar_url, role FROM users WHERE id=$1",
      [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error("users/avatar:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* --- Cập nhật thông tin cá nhân (bao gồm ngân hàng + STK) --- */
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      phone,
      address,
      school,
      student_id,
      bank_account,
      bank_name,
    } = req.body;

    const result = await pool.query(
      `UPDATE users
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             address = COALESCE($3, address),
             school = COALESCE($4, school),
             student_id = COALESCE($5, student_id),
             bank_account = COALESCE($6, bank_account),
             bank_name = COALESCE($7, bank_name)
       WHERE id = $8
       RETURNING id, username, email, role, name, phone, address, school, student_id, bank_account, bank_name, avatar_url`,
      [name, phone, address, school, student_id, bank_account, bank_name, userId]
    );

    return res.json({
      message: "Cập nhật hồ sơ thành công",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật người dùng:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/me/password", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ error: "Thiếu old_password hoặc new_password" });
    }

    const r = await pool.query("SELECT password FROM users WHERE id=$1", [userId]);
    if (!r.rowCount) return res.status(404).json({ error: "Không tìm thấy user" });

    const ok = await bcrypt.compare(old_password, r.rows[0].password);
    if (!ok) return res.status(400).json({ error: "Mật khẩu cũ không đúng" });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashed, userId]);

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Lỗi đổi mật khẩu:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/** Admin: GET /api/users/admin/find?email=... */
router.get("/admin/find", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const email = (req.query.email || "").trim();
    if (!email) return res.status(400).json({ error: "Thiếu email" });

    const { rows } = await pool.query(
      "SELECT id, username, email, role, avatar_url FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1",
      [email]
    );
    if (!rows.length) return res.status(404).json({ error: "Không tìm thấy người dùng" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("admin/find:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/** Admin: PUT /api/users/role/:id  body { role } */
router.put("/role/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const role = String(req.body.role || "").toLowerCase();
    if (!["buyer", "seller", "admin", "user"].includes(role))
      return res.status(400).json({ error: "role không hợp lệ" });

    await pool.query("UPDATE users SET role=$1 WHERE id=$2", [role, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error("update role:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/users
 * query:
 *   page (default 1)
 *   limit (default 12)
 *   q (optional) - tìm theo username, email hoặc id
 *
 * response:
 * { items: [...], total: Number, page: Number, limit: Number }
 */
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
    const q = (req.query.q || "").trim();

    const offset = (page - 1) * limit;

    // build where clause and params safely
    const whereClauses = [];
    const params = [];
    let p = 1;

    if (q) {
      // support search by id exact, or partial match on username/email (case-insensitive)
      if (/^\d+$/.test(q)) {
        whereClauses.push(`id = $${p++}`);
        params.push(Number(q));
      } else {
        whereClauses.push(`(LOWER(username) LIKE $${p} OR LOWER(email) LIKE $${p})`);
        params.push(`%${q.toLowerCase()}%`);
        p++;
      }
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // total count
    const countSql = `SELECT COUNT(*)::int AS total FROM users ${where}`;
    const countRes = await pool.query(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    // select page
    const selectSql = `
      SELECT id, username, email, role, avatar_url, phone, created_at
      FROM users
      ${where}
      ORDER BY created_at DESC
      LIMIT $${p++} OFFSET $${p++}
    `;
    params.push(limit, offset);

    const { rows } = await pool.query(selectSql, params);

    res.json({
      items: rows,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("GET /api/users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * PATCH /api/users/:id
 * body: { role?: "buyer"|"seller"|"admin"|"user", is_active?: boolean }
 */
router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Id không hợp lệ" });

    const allowedRoles = ["buyer", "seller", "admin", "user"];
    const updates = [];
    const params = [];
    let p = 1;

    if (req.body.role !== undefined) {
      const role = String(req.body.role).toLowerCase();
      if (!allowedRoles.includes(role)) return res.status(400).json({ error: "role không hợp lệ" });
      updates.push(`role = $${p++}`);
      params.push(role);
    }

    if (req.body.is_active !== undefined) {
      updates.push(`is_active = $${p++}`);
      params.push(Boolean(req.body.is_active));
    }

    // Bạn có thể cho phép cập nhật thêm trường khác nếu cần

    if (updates.length === 0) return res.status(400).json({ error: "Không có trường để cập nhật" });

    params.push(id); // last param = id
    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = $${p} RETURNING id, username, email, role, is_active, avatar_url, created_at`;
    const { rows } = await pool.query(sql, params);

    if (!rows.length) return res.status(404).json({ error: "Người dùng không tồn tại" });

    res.json({ ok: true, user: rows[0] });
  } catch (e) {
    console.error("PATCH /api/users/:id error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /api/users/:id
 * Admin-only hard delete (thận trọng)
 */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Id không hợp lệ" });

    // tránh admin xoá chính họ (tuỳ bạn có muốn)
    if (req.user.id === id) return res.status(400).json({ error: "Không thể xoá chính tài khoản của bạn" });

    // nếu bạn muốn soft-delete thay vì hard-delete, đổi UPDATE users SET deleted=true ...
    const { rowCount } = await pool.query("DELETE FROM users WHERE id=$1", [id]);

    if (!rowCount) return res.status(404).json({ error: "Người dùng không tồn tại" });

    res.json({ ok: true, deleted: id });
  } catch (e) {
    console.error("DELETE /api/users/:id error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * PATCH /api/users/:id/reset-password
 * body: { new_password: string }
 * Admin only
 */
router.patch("/:id/reset-password", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { new_password } = req.body;

    if (!id || !new_password)
      return res.status(400).json({ error: "Thiếu id hoặc new_password" });

    // kiểm tra user tồn tại
    const { rows: existing } = await pool.query("SELECT id FROM users WHERE id=$1", [id]);
    if (!existing.length)
      return res.status(404).json({ error: "Không tìm thấy người dùng" });

    // hash mật khẩu mới
    const hashed = await bcrypt.hash(new_password, 10);

    // cập nhật
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashed, id]);

    res.json({ ok: true, message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("reset-password error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ✅ API: Cập nhật Onboarding (Vai trò & Sở thích) */
router.put("/onboarding", authMiddleware, async (req, res) => {
  try {
    const { role_intent, interests } = req.body;
    // interests là mảng ID category, ví dụ [1, 2]

    await pool.query(
      `UPDATE users SET role_intent = $1, interests = $2::jsonb WHERE id = $3`,
      [role_intent, JSON.stringify(interests || []), req.user.id]
    );

    // Trả về user mới để frontend cập nhật Context
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi cập nhật" });
  }
});

/* ✅ API: Lấy review mình ĐÃ VIẾT (Review Sent) - Logic cũ */
router.get("/:id/reviews", async (req, res) => {
  // ... (Code cũ của bạn lấy review user đã viết)
});

/* ✅ API MỚI: Lấy review KHÁCH VIẾT VỀ MÌNH (Review Received) */
/* Dành cho Seller xem khách nói gì về sản phẩm của mình */
router.get("/me/reviews-received", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, 
              p.name as product_name, p.image_url as product_image,
              u.username as reviewer_name, u.avatar_url as reviewer_avatar
       FROM product_reviews r
       JOIN products p ON r.product_id = p.id
       JOIN users u ON r.user_id = u.id -- Người viết review
       WHERE p.user_id = $1 -- Sản phẩm thuộc về người bán này (tôi)
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    // Normalize images
    const normalized = rows.map(r => ({
      ...r,
      images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images
    }));

    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;