// backend/routes/authRoutes.js
import express from "express";
import pool from "../models/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { validateRegister, validateLogin } from "../middleware/validators.js";

const router = express.Router();

/* -------- Đăng ký -------- */
router.post("/register", validateRegister, async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    // ... (đoạn check exists giữ nguyên)

    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      // 👇 Thêm role_intent và interests vào RETURNING
      `INSERT INTO users (username, password, email, phone, role)
       VALUES ($1,$2,$3,$4,'user')
       RETURNING id, username, email, phone, role, avatar_url, role_intent, interests`,
      [username, hashed, email, phone]
    );

    const token = jwt.sign({ id: rows[0].id, email: rows[0].email, role: rows[0].role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ user: rows[0], token });
  } catch (e) {
    console.error("register:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------- Đăng nhập -------- */
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    // 👇 SELECT * thì đã lấy đủ cột, nhưng cần trả về trong json
    const q = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (!q.rowCount) return res.status(400).json({ error: "Sai email hoặc mật khẩu" });

    const user = q.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Sai email hoặc mật khẩu" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar_url: user.avatar_url,
        // ✅ QUAN TRỌNG: Phải trả về 2 trường này
        role_intent: user.role_intent,
        interests: user.interests
      },
    });
  } catch (e) {
    console.error("login:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------- Lấy user hiện tại (TRẢ ĐỦ TRƯỜNG) -------- */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      // 👇 Thêm role_intent, interests vào đây
      `SELECT id, username, email, phone, role, avatar_url,
              address, name, school, student_id, age,
              role_intent, interests
         FROM users WHERE id=$1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Không tìm thấy user" });
    res.json(rows[0]);
  } catch (e) {
    console.error("/me:", e);
    res.status(500).json({ error: "Server error" });
  }
});
/* -------- Đăng xuất -------- */
router.post("/logout", (req, res) => res.json({ ok: true }));

/* ====== Alias FE: PUT /api/auth/me (update profile) ====== */
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, phone, address, name, school, student_id, age } = req.body;

    const { rows } = await pool.query(
      `UPDATE users
         SET username   = COALESCE($1, username),
             phone      = COALESCE($2, phone),
             address    = COALESCE($3, address),
             name       = COALESCE($4, name),
             school     = COALESCE($5, school),
             student_id = COALESCE($6, student_id),
             age        = COALESCE($7, age)
       WHERE id=$8
       RETURNING id, username, email, phone, role, avatar_url,
                 address, name, school, student_id, age`,
      [username ?? name ?? null, phone ?? null, address ?? null, name ?? null, school ?? null, student_id ?? null, age ?? null, userId]
    );

    res.json({ user: rows[0] });
  } catch (e) {
    console.error("auth/me PUT:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ====== Alias FE: /api/auth/password ====== */
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
  } catch (e) {
    console.error("auth/password:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ====== Alias FE: /api/auth/avatar (field: avatar) ====== */
router.put("/avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Thiếu file avatar" });
    const rel = `uploads/${req.file.filename}`;
    await pool.query("UPDATE users SET avatar_url=$1 WHERE id=$2", [rel, req.user.id]);

    const { rows } = await pool.query(
      `SELECT id, username, email, phone, role, avatar_url,
              address, name, school, student_id, age
         FROM users WHERE id=$1`,
      [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (e) {
    console.error("auth/avatar:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
