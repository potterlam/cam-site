"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export interface RoomMemberInfo {
  userId: string;
  userName: string;
  role: "PLAYER" | "SPECTATOR";
  socketId: string;
}

interface UseSocketOptions {
  roomCode: string;
  userId: string;
  userName: string;
  role: "PLAYER" | "SPECTATOR";
}

export function useSocket({ roomCode, userId, userName, role }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [members, setMembers] = useState<RoomMemberInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-room", { roomCode, userId, userName, role });
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("room-members", (memberList: RoomMemberInfo[]) => {
      setMembers(memberList);
    });

    socket.on("member-joined", (member: RoomMemberInfo) => {
      setMembers((prev) => [...prev.filter((m) => m.socketId !== member.socketId), member]);
    });

    socket.on("member-left", ({ socketId }: { socketId: string }) => {
      setMembers((prev) => prev.filter((m) => m.socketId !== socketId));
    });

    return () => {
      socket.disconnect();
    };
  }, [roomCode, userId, userName, role]);

  const emit = useCallback(<T>(event: string, data: T) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, members, isConnected, emit, on };
}
