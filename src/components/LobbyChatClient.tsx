"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import ChatPanel from "@/components/ChatPanel";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const LOBBY_ROOM = "__lobby__";

interface LobbyChatClientProps {
  userId: string;
  userName: string;
}

export default function LobbyChatClient({ userId, userName }: LobbyChatClientProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = s;

    s.on("connect", () => {
      setSocket(s);
      setIsConnected(true);
      s.emit("join-room", { roomCode: LOBBY_ROOM, userId, userName, role: "SPECTATOR" });
    });

    s.on("disconnect", () => {
      setIsConnected(false);
      setSocket(null);
    });

    return () => { s.disconnect(); };
  }, [userId, userName]);

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl flex flex-col p-4 z-50">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="font-semibold text-sm text-violet-300">🌐 Lobby Chat</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isConnected ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-500"}`}>
          {isConnected ? "● Live" : "Connecting..."}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <ChatPanel
          socket={socket}
          roomCode={LOBBY_ROOM}
          myUserId={userId}
          myName={userName}
        />
      </div>
    </div>
  );
}
