import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../models/db.js";

const router = express.Router();

// === SETUP UPLOAD ===
const uploadDir = "uploads/banners";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/* --------- POST: Upload banner --------- */
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { link, active } = req.body;
    const imagePath = `/uploads/banners/${req.file.filename}`;

    const result = await pool.query(
      "INSERT INTO banners (image_url, link, active) VALUES ($1, $2, $3) RETURNING *",
      [imagePath, link || "", active === "true"]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi upload banner" });
  }
});

/* --------- GET: Danh sách banner --------- */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM banners WHERE active = TRUE ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Không lấy được banner" });
  }
});

/* --------- DELETE banner --------- */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM banners WHERE id = $1", [id]);
    res.json({ message: "Đã xóa banner" });
  } catch (err) {
    res.status(500).json({ error: "Không xóa được banner" });
  }
});

export default router;
