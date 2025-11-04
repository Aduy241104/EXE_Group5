// backend/routes/address.js
import express from "express";
import { pool } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET user's addresses
router.get("/users/:id/addresses", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query("SELECT * FROM addresses WHERE user_id=$1 ORDER BY id DESC", [id]);
  res.json(rows);
});

// POST new address
router.post("/addresses", verifyToken, async (req, res) => {
  const { name, phone, address } = req.body;
  const { userId } = req.user;
  const { rows } = await pool.query(
    "INSERT INTO addresses (user_id, name, phone, address) VALUES ($1, $2, $3, $4) RETURNING *",
    [userId, name, phone, address]
  );
  res.json(rows[0]);
});

// PUT update address
router.put("/addresses/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, phone, address } = req.body;
  const { rows } = await pool.query(
    "UPDATE addresses SET name=$1, phone=$2, address=$3 WHERE id=$4 RETURNING *",
    [name, phone, address, id]
  );
  res.json(rows[0]);
});

// DELETE address
router.delete("/addresses/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM addresses WHERE id=$1", [id]);
  res.json({ success: true });
});

export default router;
