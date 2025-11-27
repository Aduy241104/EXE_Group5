// backend/controllers/messageController.js
import pool from "../models/db.js";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

/** Helper: kiểm tra user là thành viên của hội thoại */
async function isMember(conversationId, userId) {
  const { rows } = await pool.query(
    "SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2",
    [conversationId, userId]
  );
  return rows.length > 0;
}

/** (1) Đảm bảo có hội thoại 1-1, trả về { conversation_id }  */
export const ensureDMConversation = async (req, res) => {
  try {
    const me = req.user.id;
    const other_user_id = Number(req.body.other_user_id);
    if (!other_user_id || other_user_id === me) {
      return res.status(400).json({ error: "other_user_id không hợp lệ" });
    }

    // Tìm hội thoại 1-1 có đúng 2 thành viên (me, other)
    const { rows: exRows } = await pool.query(
      `
      SELECT c.id
      FROM conversations c
      JOIN conversation_members cm ON cm.conversation_id = c.id
      WHERE c.is_group = false
        AND cm.user_id IN ($1, $2)
      GROUP BY c.id
      HAVING COUNT(*) = 2
      LIMIT 1
      `,
      [me, other_user_id]
    );

    if (exRows.length) {
      return res.json({ conversation_id: exRows[0].id });
    }

    // Tạo mới hội thoại + 2 thành viên
    const { rows: convRows } = await pool.query(
      `INSERT INTO conversations (is_group) VALUES (false) RETURNING id`
    );
    const conversationId = convRows[0].id;

    await pool.query(
      `INSERT INTO conversation_members (conversation_id, user_id)
       VALUES ($1,$2), ($1,$3)`,
      [conversationId, me, other_user_id]
    );

    return res.json({ conversation_id: conversationId });
  } catch (err) {
    console.error("ensureDMConversation:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/** (2) Danh sách hội thoại của tôi: last_message + unread_count + info đối tác */
export const listConversations = async (req, res) => {
  try {
    const me = req.user.id;

    const { rows } = await pool.query(
      `
      WITH my_convs AS (
        SELECT cm.conversation_id
        FROM conversation_members cm
        WHERE cm.user_id = $1
      ),
      last_msg AS (
        SELECT DISTINCT ON (m.conversation_id)
               m.conversation_id, m.id AS message_id, m.content, m.image_url,
               m.sender_id, m.created_at
        FROM chat_messages m
        WHERE m.conversation_id IN (SELECT conversation_id FROM my_convs)
        ORDER BY m.conversation_id, m.created_at DESC
      ),
      unread AS (
        SELECT m.conversation_id, COUNT(*)::int AS unread_count
        FROM chat_messages m
        LEFT JOIN message_reads r
          ON r.message_id = m.id AND r.user_id = $1
        WHERE m.conversation_id IN (SELECT conversation_id FROM my_convs)
          AND m.sender_id <> $1
          AND r.message_id IS NULL
        GROUP BY m.conversation_id
      )
      SELECT c.id AS conversation_id,
             -- đối tác trong hội thoại 1-1 (nếu nhóm thì có thể null)
             (SELECT u.id
              FROM conversation_members cm2
              JOIN users u ON u.id = cm2.user_id
              WHERE cm2.conversation_id = c.id AND cm2.user_id <> $1
              LIMIT 1) AS other_user_id,
             (SELECT u.username
              FROM conversation_members cm2
              JOIN users u ON u.id = cm2.user_id
              WHERE cm2.conversation_id = c.id AND cm2.user_id <> $1
              LIMIT 1) AS other_user_name,
             (SELECT u.avatar
              FROM conversation_members cm2
              JOIN users u ON u.id = cm2.user_id
              WHERE cm2.conversation_id = c.id AND cm2.user_id <> $1
              LIMIT 1) AS other_user_avatar,
             COALESCE(u.unread_count, 0) AS unread_count,
             lm.message_id, lm.content, lm.image_url, lm.sender_id, lm.created_at
      FROM conversations c
      LEFT JOIN last_msg lm ON lm.conversation_id = c.id
      LEFT JOIN unread u   ON u.conversation_id = c.id
      WHERE c.id IN (SELECT conversation_id FROM my_convs)
      ORDER BY lm.created_at DESC NULLS LAST
      `,
      [me]
    );

    const convs = rows.map((r) => ({
      conversation_id: r.conversation_id,
      other_user_id: r.other_user_id,
      other_user_name: r.other_user_name,
      other_user_avatar: r.other_user_avatar
        ? `${BASE_URL}/uploads/${r.other_user_avatar}`
        : null,
      unread_count: r.unread_count || 0,
      last_message: r.message_id
        ? {
            id: r.message_id,
            sender_id: r.sender_id,
            content: r.content,
            image_url: r.image_url ? `${BASE_URL}/uploads/${r.image_url}` : null,
            created_at: r.created_at,
          }
        : null,
    }));

    return res.json(convs);
  } catch (err) {
    console.error("listConversations:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/** (3) Danh sách tin nhắn trong hội thoại (có phân trang before_id, limit) */
export const listMessages = async (req, res) => {
  try {
    const me = req.user.id;
    const conversationId = Number(req.params.id);
    const before_id = req.query.before_id ? Number(req.query.before_id) : null;
    const limit = Math.min(Number(req.query.limit || 50), 200);

    if (!(await isMember(conversationId, me))) {
      return res.status(403).json({ error: "Không có quyền truy cập hội thoại" });
    }

    const params = [conversationId];
    let sql = `
      SELECT id, sender_id, content, image_url, created_at
      FROM chat_messages
      WHERE conversation_id = $1
    `;
    if (before_id) {
      params.push(before_id);
      sql += ` AND id < $2 `;
    }
    params.push(limit);
    sql += ` ORDER BY id DESC LIMIT $${params.length} `;

    const { rows } = await pool.query(sql, params);

    // Trả theo thứ tự thời gian tăng dần (cũ → mới)
    const msgs = rows
      .map((m) => ({
        ...m,
        image_url: m.image_url ? `${BASE_URL}/uploads/${m.image_url}` : null,
      }))
      .reverse();

    return res.json(msgs);
  } catch (err) {
    console.error("listMessages:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/** (4) Gửi tin nhắn. Hỗ trợ:
 *  - POST /conversations/:id/messages
 *  - POST /send  (body: { conversation_id, content, image_url })
 */
export const sendMessage = async (req, res) => {
  try {
    const me = req.user.id;
    const paramId = req.params.id ? Number(req.params.id) : null;
    const { conversation_id, content, image_url } = req.body;
    const conversationId = paramId || Number(conversation_id);

    if (!conversationId) {
      return res.status(400).json({ error: "Thiếu conversation_id" });
    }
    if (!(await isMember(conversationId, me))) {
      return res.status(403).json({ error: "Không có quyền gửi tin nhắn" });
    }
    if ((!content || !String(content).trim()) && !image_url) {
      return res.status(400).json({ error: "Thiếu nội dung hoặc ảnh" });
    }

    const { rows } = await pool.query(
      `INSERT INTO chat_messages (conversation_id, sender_id, content, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conversation_id, sender_id, content, image_url, created_at`,
      [conversationId, me, content ?? null, image_url ?? null]
    );

    const message = {
      ...rows[0],
      image_url: rows[0].image_url
        ? `${BASE_URL}/uploads/${rows[0].image_url}`
        : null,
    };

    // Phát sự kiện realtime tới phòng hội thoại
    try {
      const io = req.app.get("io"); // set sẵn trong server.js
      if (io) {
        io.of("/chat")
          .to(`c:${conversationId}`)
          .emit("message:new", { message });
      }
    } catch (e) {
      // Không cản response khi WS lỗi
      console.warn("WS emit error (message:new):", e.message);
    }

    return res.status(201).json(message);
  } catch (err) {
    console.error("sendMessage:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/** (5) Đánh dấu đã đọc tới last_message_id */
export const markRead = async (req, res) => {
  try {
    const me = req.user.id;
    const conversationId = Number(req.params.id);
    const last_message_id = Number(req.body.last_message_id);

    if (!conversationId || !last_message_id) {
      return res.status(400).json({ error: "Thiếu tham số" });
    }
    if (!(await isMember(conversationId, me))) {
      return res.status(403).json({ error: "Không có quyền" });
    }

    await pool.query(
      `
      INSERT INTO message_reads (message_id, user_id)
      SELECT m.id, $2
      FROM chat_messages m
      LEFT JOIN message_reads r
        ON r.message_id = m.id AND r.user_id = $2
      WHERE m.conversation_id = $1
        AND m.id <= $3
        AND r.message_id IS NULL
      `,
      [conversationId, me, last_message_id]
    );

    // Phát event "read" tới người còn lại
    try {
      const io = req.app.get("io");
      if (io) {
        io.of("/chat")
          .to(`c:${conversationId}`)
          .emit("read", { lastMessageId: last_message_id });
      }
    } catch (e) {
      console.warn("WS emit error (read):", e.message);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("markRead:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
