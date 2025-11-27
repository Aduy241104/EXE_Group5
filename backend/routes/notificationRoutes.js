// backend/routes/notificationRoutes.js
import express from "express";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

/* ========= List/Get =========
   Trả về mảng thuần để frontend dễ dùng: res.json(rows)
*/
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, title, body, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    const unread = rows.filter((r) => !r.is_read).length;
    // Trả về mảng trực tiếp
    return res.json(rows);
  } catch (e) {
    console.error("notif list error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ========= Admin send =========
   body: { target: 'all' | [ids] | {type:'byEmail', value} | {type:'byUsername', value}, title, body }
   Insert nhiều bản ghi và RETURNING * để emit chính xác record (có id, created_at)
*/
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { target, title, body } = req.body;
    if (!title) return res.status(400).json({ error: "Thiếu title" });

    let ids = [];

    if (target === "all") {
      const { rows } = await pool.query("SELECT id FROM users");
      ids = rows.map((r) => r.id);
    } else if (Array.isArray(target)) {
      ids = target.map((x) => Number(x)).filter(Boolean);
    } else if (target?.type === "byEmail" && target.value) {
      const { rows } = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [target.value]
      );
      ids = rows.map((r) => r.id);
    } else if (target?.type === "byUsername" && target.value) {
      const { rows } = await pool.query(
        "SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1",
        [target.value]
      );
      ids = rows.map((r) => r.id);
    }

    if (!ids.length) return res.json({ ok: true, inserted: 0 });

    // Build multi-row insert with parameters and RETURNING *
    const valuesSQL = [];
    const params = [];
    let p = 1;
    ids.forEach((uid) => {
      // (user_id, title, body)
      valuesSQL.push(`($${p++}, $${p++}, $${p++})`);
      params.push(uid, title, body || "");
    });

    const insertSQL = `INSERT INTO notifications (user_id, title, body)
                       VALUES ${valuesSQL.join(",")}
                       RETURNING id, user_id, title, body, is_read, created_at`;

    const { rows: insertedRows } = await pool.query(insertSQL, params);

    // socket.io emit: emit per-user with the inserted record, and broadcast 'all' if target === 'all'
    const io = req.app && req.app.get("io");
    if (!io) {
      console.warn("No io instance found on app - cannot emit notifications via socket");
    } else {
      // emit to each user
insertedRows.forEach((r) => {
  try {
    io.to(`user_${r.user_id}`).emit("notification:new", r);
    console.log(`Emitted notification:new to user_${r.user_id}`);
  } catch (err) {
    console.warn("Emit per-user failed", err);
  }
});
// broadcast convenience event
if (target === "all") {
  try {
    io.emit("notification:new:all", {
      title,
      body: body || "",
      created_at: new Date().toISOString(),
    });
    console.log("Emitted notification:new:all");
  } catch (err) {
    console.warn("Emit broadcast failed", err);
  }
}
    }

    return res.json({ ok: true, inserted: insertedRows.length });
  } catch (e) {
    console.error("notif post error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ========= Mark all read ========= */
router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
      [req.user.id]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("notif read-all error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ========= Clear all ========= */
router.delete("/", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM notifications WHERE user_id = $1", [
      req.user.id,
    ]);
    return res.json({ ok: true });
  } catch (e) {
    console.error("notif clear error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
