import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "admin", text: "Xin chào 👋, bạn cần hỗ trợ gì không?" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: "me", text: input }]);
    setInput("");
  };

  return (
    <>
      {/* Nút bật chat */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-orange-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-orange-700 z-40"
        >
          💬 Hỗ trợ
        </button>
      )}

      {/* Popup Chat với animation */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 w-80 bg-white shadow-xl rounded-lg flex flex-col z-50"
          >
            {/* Header */}
            <div className="bg-orange-500 text-white px-4 py-2 flex justify-between items-center rounded-t-lg">
              <span className="font-semibold">Chat với Admin</span>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 h-64">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.from === "me" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[75%] text-sm ${
                      msg.from === "me"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-2 border-t flex gap-2">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                className="flex-1 border px-2 py-1 rounded text-sm focus:outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                className="bg-orange-500 text-white px-3 rounded text-sm hover:bg-orange-600"
                onClick={sendMessage}
              >
                Gửi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
