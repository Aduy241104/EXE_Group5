import api from '../lib/api';
import { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Image as ImageIcon, Smile } from "lucide-react";
import { io } from "socket.io-client";

import { toast } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Messages() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, token } = useContext(AuthContext);

  const sellerId = location.state?.sellerId;
  const sellerName = location.state?.sellerName;
  const urlConversationId = searchParams.get("c"); // hỗ trợ /messages?c=123

  const socketRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { conversation_id, other_user_id, other_user_name }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Kết nối socket
  useEffect(() => {
    if (!user) return;
    const sock = io(`${API}/chat`, {
      auth: { userId: user.id }, // có thể đổi sang token nếu bạn xác thực bằng JWT ở socket
      transports: ["websocket"],
    });
    socketRef.current = sock;

    // typing indicator từ đối phương
    sock.on("typing", ({ userId, isTyping }) => {
      // có thể hiển thị "đang nhập..."
      // ở đây demo đơn giản:
      setIsTyping(!!isTyping);
    });

    // nhận tin nhắn mới realtime
    sock.on("message:new", (payload) => {
      const { message } = payload;
      // chỉ append nếu đúng phòng đang mở
      if (message.conversation_id === activeChat?.conversation_id) {
        setMessages((prev) => [...prev, mapMsg(message)]);
        // cập nhật lastMessage cho sidebar
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === activeChat.conversation_id
              ? { ...c, last_message: { ...message }, unread_count: 0 }
              : c
          )
        );
      } else {
        // tăng unread ở hội thoại tương ứng
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === message.conversation_id
              ? { ...c, unread_count: (c.unread_count || 0) + 1 }
              : c
          )
        );
      }
    });

    return () => {
      sock.disconnect();
    };
  }, [user, activeChat?.conversation_id]);

  // Helper format msg
  const mapMsg = (m) => ({
    id: m.id,
    sender_id: m.sender_id,
    content: m.content,
    image_url: m.image_url,
    created_at: m.created_at,
  });

  // Lấy danh sách hội thoại + auto chọn
  const fetchConversations = async () => {
    const { data } = await api.get(`${API}/api/messages/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setConversations(data);

    // Ưu tiên id từ URL
    if (urlConversationId) {
      const found = data.find((c) => String(c.conversation_id) === String(urlConversationId));
      if (found) {
        setActiveChat(found);
        return;
      }
    }

    // Hoặc state từ ProductDetail
    if (sellerId && sellerName) {
      const ensure = await api.post(
        `${API}/api/messages/ensure`,
        { other_user_id: sellerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const cid = ensure.data.conversation_id;

      const exist = data.find((c) => c.conversation_id === cid);
      if (exist) setActiveChat(exist);
      else {
        // chưa có trong list do last_message null → tự thêm
        const temp = {
          conversation_id: cid,
          other_user_id: sellerId,
          other_user_name: sellerName,
          unread_count: 0,
          last_message: null,
        };
        setConversations((prev) => [temp, ...prev]);
        setActiveChat(temp);
      }
      return;
    }

    // fallback chọn hội thoại mới nhất
    if (data.length) setActiveChat(data[0]);
  };

  // Khi mount hoặc token đổi → nạp danh sách hội thoại
  useEffect(() => {
    if (!token) return;
    fetchConversations().catch((e) => console.error(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Khi activeChat đổi → join room + nạp tin nhắn
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChat) return;
      // join room
      socketRef.current?.emit("join", { conversationId: activeChat.conversation_id });

      // load messages
      const { data } = await api.get(
        `${API}/api/messages/conversations/${activeChat.conversation_id}/messages?limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(data);

      // mark read
      if (data.length) {
        const lastId = data[data.length - 1].id;
        await api.post(
          `${API}/api/messages/conversations/${activeChat.conversation_id}/read`,
          { last_message_id: lastId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        socketRef.current?.emit("read", {
          conversationId: activeChat.conversation_id,
          lastMessageId: lastId,
        });
      }
    };

    loadMessages().catch((e) => console.error(e));
  }, [activeChat, token]);

  // Scroll xuống cuối khi có tin mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text) return;
    if (!activeChat) return;

    try {
      // Gửi REST để lưu DB
      const { data: saved } = await api.post(
        `${API}/api/messages/conversations/${activeChat.conversation_id}/messages`,
        { content: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Emit cho phòng (server cũng có thể tự broadcast, nhưng ta emit để realtime ngay)
      socketRef.current?.emit("message:send", {
        conversationId: activeChat.conversation_id,
        message: saved,
      });

      setMessages((prev) => [...prev, mapMsg(saved)]);
      setNewMessage("");

      // cập nhật last message sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.conversation_id === activeChat.conversation_id
            ? { ...c, last_message: saved, unread_count: 0 }
            : c
        )
      );
    } catch (err) {
      console.error("send message error:", err);
      toast.error("Không thể gửi tin nhắn");
    }
  };

  // typing indicator
  const onChangeInput = (e) => {
    setNewMessage(e.target.value);
    socketRef.current?.emit("typing", {
      conversationId: activeChat?.conversation_id,
      isTyping: true,
    });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", {
        conversationId: activeChat?.conversation_id,
        isTyping: false,
      });
    }, 1200);
  };

  return (
    <div className="flex h-[80vh] bg-white rounded-xl shadow overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <h2 className="p-4 font-bold text-lg border-b">Tin nhắn</h2>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.conversation_id}
              onClick={() => setActiveChat(c)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-gray-100 transition ${
                activeChat?.conversation_id === c.conversation_id ? "bg-orange-50" : ""
              }`}
            >
              <p className="font-medium">{c.other_user_name || "Người dùng"}</p>
              <p className="text-sm text-gray-500 truncate">
                {c.last_message?.content || (c.last_message?.image_url ? "🖼️ Hình ảnh" : "—")}
              </p>
              {c.unread_count > 0 && (
                <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                  {c.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Khung chat */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b font-semibold">
          {activeChat?.other_user_name || "Chọn cuộc trò chuyện"}
          {isTyping && <span className="ml-2 text-sm text-gray-500 italic">đang nhập...</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-xs shadow ${
                  m.sender_id === user?.id
                    ? "bg-orange-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                {m.image_url && (
                  <img src={m.image_url} alt="img" className="mb-2 rounded max-w-[220px]" />
                )}
                {m.content && <p>{m.content}</p>}
                <span className="text-xs text-gray-200 block text-right mt-1">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        {/* Input */}
        <div className="p-3 border-t flex items-center gap-2 bg-white">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Smile className="w-5 h-5 text-gray-500" />
          </button>

          {/* Upload ảnh (gọi endpoint upload ở mục 4) */}
          <button
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={async () => {
              if (!activeChat) return;
              // chọn file
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("image", file);
                try {
                  const up = await api.post(`${API}/api/messages/upload`, fd, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  // Gửi tin nhắn ảnh
                  const { data: saved } = await api.post(
                    `${API}/api/messages/conversations/${activeChat.conversation_id}/messages`,
                    { image_url: up.data.filename },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  socketRef.current?.emit("message:send", {
                    conversationId: activeChat.conversation_id,
                    message: saved,
                  });
                  setMessages((prev) => [...prev, saved]);
                } catch (e) {
                  console.error(e);
                  toast.error("Tải ảnh thất bại");
                }
              };
              input.click();
            }}
          >
            <ImageIcon className="w-5 h-5 text-gray-500" />
          </button>

          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={onChangeInput}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 border rounded-full px-4 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
          />
          <button
            onClick={handleSend}
            className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
