// Combined Next.js + Socket.io server
// Used in production via: node server.mjs
// Socket.io runs on the SAME port as Next.js (no second Render service needed)

import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ─── Socket.io room state ─────────────────────────────────────────────────────
const rooms = new Map();
function getOrCreateRoom(code) {
  if (!rooms.has(code)) rooms.set(code, { members: new Map() });
  return rooms.get(code);
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    // Same origin — no CORS issues
    cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
  });

  io.on("connection", (socket) => {
    // ─── Room Join ─────────────────────────────────────────────────────────
    socket.on("join-room", ({ roomCode, userId, userName, role }) => {
      socket.join(roomCode);
      const room = getOrCreateRoom(roomCode);
      room.members.set(socket.id, { userId, userName, role, socketId: socket.id });

      socket.to(roomCode).emit("member-joined", { userId, userName, role, socketId: socket.id });

      const memberList = Array.from(room.members.values());
      socket.emit("room-members", memberList);
    });

    // ─── WebRTC Signaling ──────────────────────────────────────────────────
    socket.on("webrtc-offer", ({ to, offer, from }) => {
      io.to(to).emit("webrtc-offer", { from, offer });
    });
    socket.on("webrtc-answer", ({ to, answer, from }) => {
      io.to(to).emit("webrtc-answer", { from, answer });
    });
    socket.on("webrtc-ice-candidate", ({ to, candidate, from }) => {
      io.to(to).emit("webrtc-ice-candidate", { from, candidate });
    });

    // ─── Game Events ──────────────────────────────────────────────────────
    socket.on("game-start", ({ roomCode, gameType }) => {
      io.to(roomCode).emit("game-start", { gameType });
    });

    socket.on("game-move", ({ roomCode, userId, move }) => {
      const room = rooms.get(roomCode);
      if (!room) return;
      if (!room.moves) room.moves = {};
      room.moves[userId] = move;
      const players = Array.from(room.members.values()).filter((m) => m.role === "PLAYER");
      const allMoved = players.every((p) => room.moves[p.userId] !== undefined);
      if (allMoved) {
        io.to(roomCode).emit("game-moves-complete", { moves: room.moves });
        room.moves = {};
      }
    });

    socket.on("game-result", ({ roomCode, loserId, loserName, punishment }) => {
      io.to(roomCode).emit("game-result", { loserId, loserName, punishment });
    });

    socket.on("game-reset", ({ roomCode }) => {
      io.to(roomCode).emit("game-reset");
    });

    // ─── Chat ─────────────────────────────────────────────────────────────
    socket.on("chat-message", ({ roomCode, userId, userName, text }) => {
      if (!text || typeof text !== "string") return;
      const sanitized = text.trim().slice(0, 300);
      if (!sanitized) return;
      io.to(roomCode).emit("chat-message", { userId, userName, text: sanitized, timestamp: Date.now() });
    });

    socket.on("reaction", ({ roomCode, userId, userName, emoji }) => {
      io.to(roomCode).emit("reaction", { userId, userName, emoji });
    });

    // ─── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnecting", () => {
      for (const roomCode of socket.rooms) {
        const room = rooms.get(roomCode);
        if (!room) continue;
        const member = room.members.get(socket.id);
        if (member) {
          room.members.delete(socket.id);
          socket.to(roomCode).emit("member-left", { socketId: socket.id, userId: member.userId });
          if (room.members.size === 0) rooms.delete(roomCode);
        }
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
