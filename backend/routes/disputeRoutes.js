// backend/routes/disputeRoutes.js
import express from "express";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

/**
 * POST /api/disputes
 * user gửi đơn vi phạm
 * body: { target_type, target_id, reason, details }
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { target_type, target_id, reason, details } = req.body;
    if (!target_type || !target_id || !reason) return res.status(400).json({ error: "Thiếu trường bắt buộc" });

    const sql = `INSERT INTO disputes (user_id, target_type, target_id, reason, details)
                 VALUES ($1,$2,$3,$4,$5) RETURNING id, user_id, target_type, target_id, reason, details, status, admin_reply, created_at`;
    const { rows } = await pool.query(sql, [userId, target_type, target_id, reason, details || ""]);
    res.json({ ok: true, dispute: rows[0] });
  } catch (e) {
    console.error("disputes.post:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/disputes (admin)
 * query: page, limit, q, status
 */
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 30);
    const q = (req.query.q || "").trim();
    const status = req.query.status;
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];
    let p = 1;

    if (q) {
      where.push(`(LOWER(reason) LIKE $${p} OR LOWER(details) LIKE $${p} OR LOWER(target_type) LIKE $${p})`);
      params.push(`%${q.toLowerCase()}%`);
      p++;
    }
    if (status) {
      where.push(`status = $${p++}`);
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM disputes ${whereSql}`, params);
    const total = totalRes.rows[0]?.total || 0;

    params.push(limit, offset);
    const rowsRes = await pool.query(
      `SELECT d.*, u.username, u.email
       FROM disputes d
       LEFT JOIN users u ON u.id = d.user_id
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${p++} OFFSET $${p++}`,
      params
    );

    res.json({ items: rowsRes.rows, total, page, limit });
  } catch (e) {
    console.error("disputes.get:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/disputes/:id (admin)
 */
router.get("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(`SELECT d.*, u.username, u.email FROM disputes d LEFT JOIN users u ON u.id = d.user_id WHERE d.id=$1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Không tìm thấy đơn" });
    res.json(rows[0]);
  } catch (e) {
    console.error("disputes.getById:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * PATCH /api/disputes/:id/reply  (admin) -> trả lời đơn
 * body: { admin_reply, status }  status ∈ ['pending','accepted','rejected','resolved']
 */
router.patch("/:id/reply", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { admin_reply, status } = req.body;
    if (!admin_reply && !status) return res.status(400).json({ error: "Thiếu nội dung reply hoặc status" });

    const allowed = ["pending","accepted","rejected","resolved"];
    if (status && !allowed.includes(status)) return res.status(400).json({ error: "Trạng thái không hợp lệ" });

    const { rows } = await pool.query(
      `UPDATE disputes SET admin_reply = COALESCE($1, admin_reply), status = COALESCE($2, status), updated_at = now()
       WHERE id = $3 RETURNING *`,
      [admin_reply ?? null, status ?? null, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Không tìm thấy đơn" });

    // (tùy chọn) emit socket or create notification to user
    // const io = req.app.get("io"); io?.emit(`dispute:updated:${rows[0].user_id}`, rows[0]);

    res.json({ ok: true, dispute: rows[0] });
  } catch (e) {
    console.error("disputes.reply:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * PATCH /api/disputes/:id/status  (admin only) - chỉ đổi status
 * body: { status }
 */
router.patch("/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const allowed = ["pending","accepted","rejected","resolved"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "status invalid" });

    const { rows } = await pool.query(`UPDATE disputes SET status=$1, updated_at=now() WHERE id=$2 RETURNING *`, [status, id]);
    if (!rows.length) return res.status(404).json({ error: "Không tìm thấy đơn" });
    res.json({ ok: true, dispute: rows[0] });
  } catch (e) {
    console.error("disputes.status:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
