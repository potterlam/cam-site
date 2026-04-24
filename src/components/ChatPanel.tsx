"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export interface ChatMessage {
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface ChatPanelProps {
  socket: Socket | null;
  roomCode: string;
  myUserId: string;
  myName: string;
}

export default function ChatPanel({ socket, roomCode, myUserId, myName }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-199), msg]); // keep last 200
    };
    socket.on("chat-message", handler);
    return () => { socket.off("chat-message", handler); };
  }, [socket]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socket) return;
    socket.emit("chat-message", { roomCode, userId: myUserId, userName: myName, text });
    setInput("");
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <h3 className="text-sm font-semibold text-gray-400 mb-2 shrink-0">💬 Chat</h3>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-gray-600 text-center mt-4">No messages yet.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.userId === myUserId ? "items-end" : "items-start"}`}>
            <span className="text-[10px] text-gray-500 mb-0.5">{msg.userName}</span>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm break-words ${
                msg.userId === myUserId
                  ? "bg-violet-700 text-white rounded-tr-sm"
                  : "bg-gray-800 text-gray-200 rounded-tl-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 mt-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={300}
          className="flex-1 rounded-xl bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || !socket}
          className="rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-40 px-3 py-2 text-sm transition-colors"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
