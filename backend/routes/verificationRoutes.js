// backend/routes/verificationRoutes.js
import express from "express";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js"; // expects multer configured

const router = express.Router();

/**
 * POST /api/verification/apply
 * multipart/form-data:
 *  - student_id_number (optional)
 *  - school (optional)
 *  - note (optional)
 *  - id_card (file)
 *  - selfie (file)
 */
router.post(
  "/apply",
  authMiddleware,
  upload.fields([{ name: "id_card", maxCount: 1 }, { name: "selfie", maxCount: 1 }]),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // prevent multiple pending requests (optional, change logic if desired)
      const { rows: existing } = await pool.query(
        "SELECT id, status FROM student_verifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
        [userId]
      );
      if (existing.length && existing[0].status === "pending") {
        return res.status(400).json({ error: "Bạn đã có yêu cầu xác thực đang chờ xử lý." });
      }

      const { student_id_number, school, note } = req.body;
      const idCardFile = (req.files?.id_card && req.files.id_card[0]) || null;
      const selfieFile = (req.files?.selfie && req.files.selfie[0]) || null;

      const id_card_url = idCardFile ? `uploads/${idCardFile.filename}` : null;
      const selfie_url = selfieFile ? `uploads/${selfieFile.filename}` : null;

      const q = `INSERT INTO student_verifications
        (user_id, student_id_number, school, note, id_card_url, selfie_url)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`;
      const values = [userId, student_id_number || null, school || null, note || null, id_card_url, selfie_url];
      const { rows } = await pool.query(q, values);

      return res.json({ ok: true, verification: rows[0] });
    } catch (err) {
      console.error("verification apply:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/** GET /api/verification/me  -> get user's own latest verification */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query("SELECT * FROM student_verifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1", [userId]);
    return res.json(rows[0] || null);
  } catch (err) {
    console.error("verification me:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Admin: GET /api/verification  -> list (with optional status, page) */
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = (req.query.status || "").trim();

    const where = [];
    const params = [];
    let p = 1;
    if (status) { where.push(`status = $${p++}`); params.push(status); }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM student_verifications ${whereSql}`, params);
    const total = totalRes.rows[0].total || 0;

    params.push(limit, offset);
    const sql = `SELECT sv.*, u.username, u.email FROM student_verifications sv LEFT JOIN users u ON u.id=sv.user_id
      ${whereSql} ORDER BY created_at DESC LIMIT $${p++} OFFSET $${p++}`;
    const { rows } = await pool.query(sql, params);

    res.json({ items: rows, total, page, limit });
  } catch (err) {
    console.error("admin verification list:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Admin: PATCH /api/verification/:id
 * body: { status: 'approved'|'rejected', admin_note: string }
 * When approved => also set users.student_verified = true, student_verified_at = now()
 */
router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, admin_note } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Trạng thái không hợp lệ." });
    }

    // fetch verification
    const { rows: existing } = await pool.query("SELECT * FROM student_verifications WHERE id=$1", [id]);
    if (!existing.length) return res.status(404).json({ error: "Không tìm thấy yêu cầu" });

    const q = `UPDATE student_verifications SET status=$1, admin_note=$2, processed_by=$3, updated_at=now()
               WHERE id=$4 RETURNING *`;
    const values = [status, admin_note || null, req.user.id, id];
    const { rows } = await pool.query(q, values);
    const ver = rows[0];

    if (status === "approved") {
      // mark user as verified
      await pool.query("UPDATE users SET student_verified=true, student_verified_at=now() WHERE id=$1", [ver.user_id]);
    } else if (status === "rejected") {
      // optional: keep user.student_verified false
      await pool.query("UPDATE users SET student_verified=false WHERE id=$1", [ver.user_id]);
    }

    // optional: create notification (if you have notifications system)
    try {
      await pool.query(
        "INSERT INTO notifications (user_id, title, body, created_at) VALUES ($1,$2,$3,now())",
        [
          ver.user_id,
          status === "approved" ? "Xác thực sinh viên: Đã chấp nhận" : "Xác thực sinh viên: Bị từ chối",
          status === "approved" ? "Yêu cầu xác thực sinh viên của bạn đã được chấp thuận." : `Yêu cầu xác thực của bạn bị từ chối. ${admin_note || ""}`
        ]
      );
    } catch (e) {
      // ignore if notifications table doesn't exist
    }

    res.json({ ok: true, verification: ver });
  } catch (err) {
    console.error("admin patch verification:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
