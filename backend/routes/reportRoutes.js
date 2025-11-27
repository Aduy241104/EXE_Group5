// backend/routes/reportRoutes.js
import express from "express";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// simple multer config for attachments (optional)
const uploadDir = path.resolve("uploads/reports");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`)
});
const upload = multer({ storage });

// POST /api/reports
// body: { type, target_id, reason, details } + optional files field 'attachments'
router.post("/", authMiddleware, upload.array("attachments", 4), async (req, res) => {
  try {
    const reporter_id = req.user.id;
    const { type, target_id, reason, details } = req.body;

    if (!type || !reason) return res.status(400).json({ error: "Thiếu type hoặc reason" });

    const attachments = (req.files || []).map((f) => `/uploads/reports/${f.filename}`);

    const { rows } = await pool.query(
      `INSERT INTO reports (reporter_id, type, target_id, reason, details, attachments, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending') RETURNING *`,
      [reporter_id, type, target_id || null, reason, details || null, JSON.stringify(attachments)]
    );

    res.status(201).json({ ok: true, report: rows[0] });
  } catch (err) {
    console.error("POST /api/reports error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/reports  (admin) - supports simple paging & q filter
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const q = (req.query.q || "").trim();

    const where = q ? `WHERE LOWER(reason) LIKE LOWER($1) OR LOWER(details) LIKE LOWER($1)` : "";
    const params = q ? [`%${q}%`, limit, offset] : [limit, offset];

    const totalRes = await pool.query(`SELECT COUNT(*)::int AS total FROM reports ${where}`, q ? [params[0]] : []);
    const total = totalRes.rows[0]?.total ?? 0;

    const sql = `
      SELECT r.*, u.username AS reporter_username, u.email AS reporter_email
      FROM reports r
      LEFT JOIN users u ON u.id = r.reporter_id
      ${where}
      ORDER BY created_at DESC
      LIMIT $${q ? 2 : 1} OFFSET $${q ? 3 : 2}
    `;
    const qparams = params;
    const { rows } = await pool.query(sql, qparams);

    res.json({ items: rows, total, page, limit });
  } catch (err) {
    console.error("GET /api/reports error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/reports/:id (admin or reporter can view their own)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Id invalid" });

    const { rows } = await pool.query("SELECT r.*, u.username AS reporter_username FROM reports r LEFT JOIN users u ON u.id=r.reporter_id WHERE r.id=$1", [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });

    const report = rows[0];
    // allow admin OR reporter to view
    if (req.user.id !== report.reporter_id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(report);
  } catch (err) {
    console.error("GET /api/reports/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/reports/:id  (admin) - update status/comment
// body: { status: 'pending'|'reviewing'|'resolved'|'rejected', admin_comment }
router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, admin_comment } = req.body;
    const allowed = ["pending", "reviewing", "resolved", "rejected"];
    if (status && !allowed.includes(status)) return res.status(400).json({ error: "Status invalid" });

    const params = [];
    const updates = [];
    let p = 1;
    if (status !== undefined) { updates.push(`status=$${p++}`); params.push(status); }
    if (admin_comment !== undefined) { updates.push(`admin_comment=$${p++}`); params.push(admin_comment); }
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    params.push(id);

    const sql = `UPDATE reports SET ${updates.join(", ")} WHERE id=$${p} RETURNING *`;
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return res.status(404).json({ error: "Not found" });

    res.json({ ok: true, report: rows[0] });
  } catch (err) {
    console.error("PATCH /api/reports/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/reports/:id (admin)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await pool.query("DELETE FROM reports WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true, deleted: id });
  } catch (err) {
    console.error("DELETE /api/reports/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
