// src/pages/Messages.jsx
import api from "@/lib/api";
import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Send, Image as ImageIcon } from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { AuthContext } from "@/context/AuthContext";
import { motion } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL;

function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
function nanoid(size = 16) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";
  for (let i = 0; i < size; i++) id += chars[(Math.random() * chars.length) | 0];
  return id;
}

const socket = io(`${API_BASE}/chat`, {
  path: "/socket.io",
  transports: ["websocket"],
  autoConnect: false,
  withCredentials: false,
});

export default function Messages() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, token } = useContext(AuthContext);

  const sellerId = location.state?.sellerId;
  const sellerName = location.state?.sellerName;
  const urlConversationId = searchParams.get("c");

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const prevRoomRef = useRef(null);
  const oldestIdRef = useRef(null);

  // ===== Socket lifecycle =====
  useEffect(() => {
    if (!token) return;

    socket.auth = { token };
    if (!socket.connected) socket.connect();

    const onTyping = ({ conversationId, isTyping }) => {
      if (conversationId === activeChat?.conversation_id) setIsTyping(!!isTyping);
    };
    const onNewMessage = ({ message }) => {
      if (message.conversation_id === activeChat?.conversation_id) {
        setMessages((prev) => {
          const idx = prev.findIndex(
            (m) => m.client_temp_id && m.status === "sending"
          );
          if (idx !== -1 && prev[idx].content === message.content) {
            const next = [...prev];
            next[idx] = message;
            return next;
          }
          return [...prev, message];
        });
        if (bottomRef.current)
          bottomRef.current.scrollIntoView({ behavior: "smooth" });
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === message.conversation_id
              ? {
                  ...c,
                  unread_count: (c.unread_count || 0) + 1,
                  last_message: message,
                }
              : c
          )
        );
      }
    };
    const onRead = ({ lastMessageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_id === user?.id && m.id <= lastMessageId
            ? { ...m, seen: true }
            : m
        )
      );
    };

    socket.on("typing", onTyping);
    socket.on("message:new", onNewMessage);
    socket.on("read", onRead);

    return () => {
      socket.off("typing", onTyping);
      socket.off("message:new", onNewMessage);
      socket.off("read", onRead);
    };
  }, [token, activeChat?.conversation_id, user?.id]);

  // ===== Load conversation list =====
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoadingList(true);
        const { data } = await api.get("/api/messages/conversations");
        setConversations(data || []);
        setLoadingList(false);
        if (urlConversationId) {
          const found = data.find(
            (c) => String(c.conversation_id) === String(urlConversationId)
          );
          if (found) return setActiveChat(found);
        }
        if (sellerId && sellerName) {
          const ensure = await api.post("/api/messages/ensure", {
            other_user_id: sellerId,
          });
          const cid = ensure.data.conversation_id;
          const exist = data.find((c) => c.conversation_id === cid);
          return setActiveChat(
            exist || {
              conversation_id: cid,
              other_user_id: sellerId,
              other_user_name: sellerName,
              unread_count: 0,
              last_message: null,
            }
          );
        }
        if (data.length) setActiveChat(data[0]);
      } catch (err) {
        setLoadingList(false);
        toast.error("Không thể tải danh sách hội thoại");
      }
    };
    if (token) loadConversations();
  }, [token]);

  // ===== Load messages =====
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChat?.conversation_id) return;
      if (prevRoomRef.current && prevRoomRef.current !== activeChat.conversation_id) {
        socket.emit("leave", { conversationId: prevRoomRef.current });
      }
      socket.emit("join", { conversationId: activeChat.conversation_id });
      prevRoomRef.current = activeChat.conversation_id;

      try {
        const { data } = await api.get(
          `/api/messages/conversations/${activeChat.conversation_id}/messages?limit=50`
        );
        setMessages(data || []);
        if (data?.length) {
          oldestIdRef.current = data[0].id;
          const lastId = data[data.length - 1].id;
          await api.post(
            `/api/messages/conversations/${activeChat.conversation_id}/read`,
            { last_message_id: lastId }
          );
          socket.emit("read", {
            conversationId: activeChat.conversation_id,
            lastMessageId: lastId,
          });
        } else {
          oldestIdRef.current = null;
          setHasMore(false);
        }
        if (bottomRef.current)
          bottomRef.current.scrollIntoView({ behavior: "instant" });
      } catch {
        toast.error("Không thể tải tin nhắn");
      }
    };
    loadMessages();
  }, [activeChat?.conversation_id]);

  // ===== Typing =====
  const emitTyping = useCallback(
    debounce(() => {
      if (!activeChat?.conversation_id) return;
      socket.emit("typing", {
        conversationId: activeChat.conversation_id,
        isTyping: true,
      });
      setTimeout(() => {
        socket.emit("typing", {
          conversationId: activeChat.conversation_id,
          isTyping: false,
        });
      }, 1200);
    }, 350),
    [activeChat?.conversation_id]
  );

  // ===== Send =====
  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || !activeChat) return;
    const tempId = nanoid();
    const optimistic = {
      id: -1,
      client_temp_id: tempId,
      conversation_id: activeChat.conversation_id,
      sender_id: user?.id,
      content,
      created_at: new Date().toISOString(),
      status: "sending",
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    setSending(true);
    try {
      const { data } = await api.post("/api/messages/send", {
        conversation_id: activeChat.conversation_id,
        content,
        type: "text",
      });
      setMessages((prev) =>
        prev.map((m) => (m.client_temp_id === tempId ? data : m))
      );
      if (bottomRef.current)
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    } catch {
      toast.error("Gửi tin nhắn thất bại");
      setMessages((prev) =>
        prev.map((m) =>
          m.client_temp_id === tempId ? { ...m, status: "failed" } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-gradient-to-b from-white to-blue-50">
      {/* Sidebar */}
      <div className="md:w-1/3 border-r bg-white overflow-y-auto rounded-tr-3xl">
        <div className="p-4 border-b font-semibold text-lg text-blue-600">
          💬 Hội thoại
        </div>
        {loadingList ? (
          <div className="p-4 text-sm text-gray-500">Đang tải...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Chưa có hội thoại.</div>
        ) : (
          conversations.map((c) => {
            const active = c.conversation_id === activeChat?.conversation_id;
            return (
              <div
                key={c.conversation_id}
                onClick={() => setActiveChat(c)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b transition ${
                  active
                    ? "bg-blue-50 ring-1 ring-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <img
                  src={c.other_user_avatar || "/logo.png"}
                  alt=""
                  className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-gray-800">
                    {c.other_user_name || "Người dùng"}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {c.last_message?.content || "—"}
                  </div>
                </div>
                {c.unread_count > 0 && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                    {c.unread_count}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white rounded-tl-3xl">
        {activeChat ? (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <img
                  src={activeChat.other_user_avatar || "/logo.png"}
                  alt=""
                  className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                />
                <div className="font-semibold text-gray-800">
                  {activeChat.other_user_name}
                </div>
              </div>
              {isTyping && (
                <div className="text-xs text-gray-500 italic">Đang nhập…</div>
              )}
            </div>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-blue-50/20 to-white"
            >
              {messages.map((m) => {
                const mine = String(m.sender_id) === String(user?.id);
                const failed = m.status === "failed";
                const sendingState = m.status === "sending";
                return (
                  <div
                    key={m.id !== -1 ? m.id : m.client_temp_id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                        mine
                          ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div>{m.content}</div>
                      <div
                        className={`text-[11px] mt-1 ${
                          mine ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {new Date(m.created_at).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {mine && (
                          <>
                            {" · "}
                            {sendingState
                              ? "Đang gửi…"
                              : failed
                              ? "Lỗi"
                              : m.seen
                              ? "Đã xem"
                              : "Đã gửi"}
                          </>
                        )}
                      </div>
                      {failed && mine && (
                        <button
                          onClick={() => retrySend(m)}
                          className="mt-1 text-[11px] underline"
                        >
                          Gửi lại
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t flex items-center gap-2 bg-white/80 backdrop-blur">
              <button
                type="button"
                className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50"
                title="Gửi ảnh (sẽ hỗ trợ sau)"
                disabled
              >
                <ImageIcon size={18} />
              </button>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  } else {
                    emitTyping();
                  }
                }}
                placeholder="Nhập tin nhắn…"
                className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 rounded-xl text-white text-sm disabled:opacity-50 relative overflow-hidden shadow"
              >
                <span className="relative z-10 flex items-center gap-1">
                  <Send size={16} /> Gửi
                </span>
                <motion.div
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500 bg-[length:200%_200%]"
                />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Chọn một cuộc trò chuyện để bắt đầu.
          </div>
        )}
      </div>
    </div>
  );
}
