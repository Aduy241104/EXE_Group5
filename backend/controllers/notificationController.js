import db from "../models/db.js";

export const createNotification = async (req, res) => {
  try {
    const { title, body, user_id } = req.body;
    const notif = await db.query(
      `INSERT INTO notifications (title, body, user_id) VALUES ($1, $2, $3) RETURNING *`,
      [title, body, user_id || null]
    );

    // Gửi socket
    if (user_id) {
      req.io.emit(`notification:new:${user_id}`, notif.rows[0]);
    } else {
      req.io.emit("notification:new:all", notif.rows[0]);
    }

    res.status(201).json(notif.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error creating notification" });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(
      `SELECT * FROM notifications WHERE user_id IS NULL OR user_id=$1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

export const markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query(`UPDATE notifications SET is_read=TRUE WHERE user_id=$1`, [userId]);
    res.json({ message: "All read" });
  } catch {
    res.status(500).json({ message: "Failed" });
  }
};
