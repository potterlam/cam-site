"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useCamera } from "@/hooks/useCamera";
import { useWebRTC } from "@/hooks/useWebRTC";
import VideoTile from "@/components/VideoTile";
import ChatPanel from "@/components/ChatPanel";
import TimerPanel from "@/components/TimerPanel";
import { DiceGame, RPSGame, RouletteGame } from "@/components/Games";
import type { RPSMove } from "@/lib/games";

export interface RoomData {
  id: string;
  code: string;
  gameType: string;
  creatorId: string;
  maxPlayers: number;
  maxSpectators: number;
  status: string;
  members: Array<{
    userId: string;
    role: string;
    user: { id: string; name: string | null; image: string | null };
  }>;
}

interface Punishment {
  id: string;
  description: string;
  severity: number;
}

interface RoomClientProps {
  roomCode: string;
  initialRoom: RoomData;
  punishments: Punishment[];
}

export default function RoomClient({ roomCode, initialRoom, punishments }: RoomClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [room, setRoom] = useState(initialRoom);
  const [gameResult, setGameResult] = useState<{
    loserId: string;
    loserName: string;
    punishment: string;
  } | null>(null);
  const [rpsmoves, setRpsMoves] = useState<Record<string, RPSMove>>({});
  const [roleLoading, setRoleLoading] = useState(false);

  const myUserId = session?.user?.id ?? "";
  const myMember = room.members.find((m) => m.userId === myUserId);
  const myRole = myMember?.role ?? "SPECTATOR";
  const myName = session?.user?.name || session?.user?.email || "Player";

  const { localStream, isMuted, isCamOff, toggleMute, toggleCam, error: camError } = useCamera();
  const { socket, members, isConnected, emit, on } = useSocket({
    roomCode,
    userId: myUserId,
    userName: myName,
    role: myRole as "PLAYER" | "SPECTATOR",
  });

  const { remoteStreams } = useWebRTC({
    socket,
    localStream,
    mySocketId: socket?.id ?? "",
    members: members.filter((m) => m.role === "PLAYER"),
  });

  // Change role
  const handleChangeRole = useCallback(async (newRole: "PLAYER" | "SPECTATOR") => {
    setRoleLoading(true);
    const res = await fetch(`/api/rooms/${roomCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setRoom((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.userId === myUserId ? { ...m, role: newRole } : m
        ),
      }));
    }
    setRoleLoading(false);
  }, [roomCode, myUserId]);

  // Leave room
  const handleLeave = useCallback(async () => {
    await fetch(`/api/rooms/${roomCode}`, { method: "DELETE" });
    router.push("/");
  }, [roomCode, router]);

  // Close room (host only)
  const handleCloseRoom = useCallback(async () => {
    if (!confirm("Close this room for everyone?")) return;
    await fetch(`/api/rooms/${roomCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    router.push("/");
  }, [roomCode, router]);

  // Listen for game events
  useEffect(() => {
    const offResult = on<{ loserId: string; loserName: string; punishment: string }>(
      "game-result",
      (data) => setGameResult(data)
    );
    const offMoves = on<{ moves: Record<string, RPSMove> }>("game-moves-complete", ({ moves }) => {
      setRpsMoves(moves);
    });
    return () => {
      offResult?.();
      offMoves?.();
    };
  }, [on]);

  const handleGameResult = useCallback(
    async (loserId: string, loserName: string, punishment: string) => {
      setGameResult({ loserId, loserName, punishment });
      emit("game-result", { roomCode, loserId, loserName, punishment });

      // Save round to DB
      await fetch(`/api/rooms/${roomCode}/round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: room.gameType, loserId, punishment }),
      });
    },
    [roomCode, room.gameType, emit]
  );

  const players = room.members
    .filter((m) => m.role === "PLAYER")
    .map((m) => ({ userId: m.userId, userName: m.user.name || m.userId }));

  const socketPlayers = members.filter((m) => m.role === "PLAYER");

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900">
        <div>
          <h1 className="font-bold text-lg">Room: <span className="text-violet-400 font-mono">{roomCode}</span></h1>
          <p className="text-xs text-gray-500">{room.gameType.replace(/_/g, " ")} · {myRole}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${isConnected ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
            {isConnected ? "● Live" : "○ Connecting"}
          </span>
          {/* Join as Player */}
          {myRole === "SPECTATOR" && (
            <button
              onClick={() => handleChangeRole("PLAYER")}
              disabled={roleLoading}
              className="text-xs px-3 py-1 rounded-full bg-violet-700 hover:bg-violet-600 disabled:opacity-50 transition-colors"
            >
              🎮 Join as Player
            </button>
          )}
          {/* Switch to Spectator */}
          {myRole === "PLAYER" && myUserId !== room.creatorId && (
            <button
              onClick={() => handleChangeRole("SPECTATOR")}
              disabled={roleLoading}
              className="text-xs px-3 py-1 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              👁️ Watch Only
            </button>
          )}
          {/* Close Room — host only */}
          {myUserId === room.creatorId && (
            <button
              onClick={handleCloseRoom}
              className="text-xs px-3 py-1 rounded-full bg-red-800 hover:bg-red-700 transition-colors"
            >
              🔴 Close Room
            </button>
          )}
          {/* Leave Room */}
          <button
            onClick={handleLeave}
            className="text-xs px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            🚪 Leave
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-auto">
          {camError && (
            <div className="mb-4 rounded-lg bg-red-900/40 border border-red-700 px-4 py-2 text-sm text-red-300">
              Camera error: {camError}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Local video */}
            <VideoTile
              stream={localStream}
              userName={myName}
              isMuted={isMuted}
              isCamOff={isCamOff}
              isLocal
            />

            {/* Remote videos from WebRTC peers */}
            {socketPlayers
              .filter((m) => m.socketId !== socket?.id)
              .map((member) => (
                <VideoTile
                  key={member.socketId}
                  stream={remoteStreams.get(member.socketId) ?? null}
                  userName={member.userName}
                />
              ))}
          </div>

          {/* Cam controls */}
          <div className="flex gap-3 mt-4 justify-center">
            <button
              onClick={toggleMute}
              className={`rounded-xl px-5 py-2 font-medium transition-colors ${
                isMuted ? "bg-red-700 hover:bg-red-600" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {isMuted ? "🔇 Unmute" : "🎙️ Mute"}
            </button>
            <button
              onClick={toggleCam}
              className={`rounded-xl px-5 py-2 font-medium transition-colors ${
                isCamOff ? "bg-red-700 hover:bg-red-600" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {isCamOff ? "📷 Cam On" : "📷 Cam Off"}
            </button>
          </div>
        </div>

        {/* Game Panel */}
        <aside className="w-80 border-l border-gray-800 bg-gray-900 flex flex-col p-4 gap-4 overflow-hidden">
          <h2 className="font-bold text-lg shrink-0">Game Panel</h2>

          {/* Game Result Banner */}
          {gameResult && (
            <div className="rounded-xl border border-orange-700 bg-orange-900/30 p-4 text-center space-y-2">
              <p className="text-orange-300 font-bold text-lg">😅 {gameResult.loserName} loses!</p>
              <p className="text-sm text-gray-300">
                Punishment: <span className="font-semibold text-white">{gameResult.punishment}</span>
              </p>
              <button
                onClick={() => { setGameResult(null); setRpsMoves({}); }}
                className="text-xs text-gray-500 underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Game Controls — only for players, not spectators */}
          {myRole === "PLAYER" && !gameResult && (
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 space-y-3">
              {room.gameType === "DICE_COMPARE" && (
                <DiceGame
                  players={players}
                  punishments={punishments}
                  onResult={handleGameResult}
                />
              )}
              {room.gameType === "ROCK_PAPER_SCISSORS" && (
                <RPSGame
                  players={players}
                  myUserId={myUserId}
                  punishments={punishments}
                  onResult={handleGameResult}
                  onEmitMove={(move) => emit("game-move", { roomCode, userId: myUserId, move })}
                  pendingMoves={rpsmoves}
                />
              )}
              {room.gameType === "ROULETTE" && (
                <RouletteGame
                  players={players}
                  punishments={punishments}
                  onResult={handleGameResult}
                />
              )}
            </div>
          )}

          {myRole === "SPECTATOR" && (
            <div className="text-center space-y-3">
              <p className="text-gray-500 text-sm">You are watching as a spectator.</p>
              <button
                onClick={() => handleChangeRole("PLAYER")}
                disabled={roleLoading}
                className="w-full rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-50 py-2 text-sm font-semibold transition-colors"
              >
                🎮 Join as Player
              </button>
            </div>
          )}

          {/* Timer */}
          <TimerPanel />

          {/* Member list */}
          <div className="shrink-0">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Members ({members.length})</h3>
            <div className="space-y-1">
              {members.map((m) => (
                <div key={m.socketId} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${m.role === "PLAYER" ? "bg-violet-400" : "bg-gray-600"}`} />
                  <span className="truncate">{m.userName}</span>
                  <span className="ml-auto text-xs text-gray-600">{m.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 border-t border-gray-800 pt-3 min-h-0">
            <ChatPanel
              socket={socket}
              roomCode={roomCode}
              myUserId={myUserId}
              myName={myName}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
