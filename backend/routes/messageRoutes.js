// backend/routes/messageRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  ensureDMConversation,
  listConversations,
  listMessages,
  sendMessage,
  markRead,
} from "../controllers/messageController.js";

const router = express.Router();

// BẮT BUỘC đăng nhập cho toàn bộ message APIs
router.use(authMiddleware);

// Tạo/đảm bảo hội thoại 1-1
// POST /api/messages/ensure  { other_user_id }
router.post("/ensure", ensureDMConversation);

// Danh sách hội thoại của tôi
// GET /api/messages/conversations
router.get("/conversations", listConversations);

// Danh sách tin nhắn (có phân trang)
// GET /api/messages/conversations/:id/messages?before_id=&limit=
router.get("/conversations/:id/messages", listMessages);

// Gửi tin nhắn theo REST kiểu mới (theo conversation param)
// POST /api/messages/conversations/:id/messages
router.post("/conversations/:id/messages", sendMessage);

// Alias để khớp FE cũ: POST /api/messages/send
// body: { conversation_id, content, image_url? }
router.post("/send", sendMessage);

// Đánh dấu đã đọc đến last_message_id
// POST /api/messages/conversations/:id/read  { last_message_id }
router.post("/conversations/:id/read", markRead);

export default router;
