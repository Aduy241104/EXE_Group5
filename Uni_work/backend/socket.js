import jwt from "jsonwebtoken";
export function registerChatNamespace(io) {
  const nsp = io.of("/chat");

  nsp.on("connection", (socket) => {
    // Nhận auth từ query (hoặc dùng middleware xác thực token tại đây)
    const { userId } = socket.handshake.auth || {};
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.data.userId = Number(userId);

    // join phòng theo conversation để broadcast
    socket.on("join", ({ conversationId }) => {
      socket.join(`conv:${conversationId}`);
    });

    // client gửi message xong thì emit cho những người trong phòng
    socket.on("message:send", (payload) => {
      // payload: { conversationId, message } // message đã tạo ở API hoặc gửi raw rồi server lưu & emit
      nsp.to(`conv:${payload.conversationId}`).emit("message:new", payload.message);
    });

    // typing indicators
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conv:${conversationId}`).emit("typing", { userId: socket.data.userId, isTyping });
    });

    // read receipt
    socket.on("read", ({ conversationId, lastMessageId }) => {
      socket.to(`conv:${conversationId}`).emit("read", { userId: socket.data.userId, lastMessageId });
    });
  });
}
