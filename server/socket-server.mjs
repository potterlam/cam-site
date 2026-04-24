// Socket.io server — run separately on Render as a standalone Node service
// Deploy this file as: node server/socket-server.js
// Set environment variable PORT on Render

import { createServer } from "http";
import { Server } from "socket.io";

const PORT = Number(process.env.PORT) || 3001;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",");

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track rooms: roomCode -> { players: Map<socketId, {userId, name, role}> }
const rooms = new Map();

function getOrCreateRoom(code) {
  if (!rooms.has(code)) rooms.set(code, { members: new Map() });
  return rooms.get(code);
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // ─── Room Join ─────────────────────────────────────────────────────────────
  socket.on("join-room", ({ roomCode, userId, userName, role }) => {
    socket.join(roomCode);
    const room = getOrCreateRoom(roomCode);
    room.members.set(socket.id, { userId, userName, role, socketId: socket.id });

    // Notify others in room
    socket.to(roomCode).emit("member-joined", { userId, userName, role, socketId: socket.id });

    // Send current member list to the new joiner
    const memberList = Array.from(room.members.values());
    socket.emit("room-members", memberList);

    console.log(`${userName} joined room ${roomCode} as ${role}`);
  });

  // ─── WebRTC Signaling ──────────────────────────────────────────────────────
  socket.on("webrtc-offer", ({ to, offer, from }) => {
    io.to(to).emit("webrtc-offer", { from, offer });
  });

  socket.on("webrtc-answer", ({ to, answer, from }) => {
    io.to(to).emit("webrtc-answer", { from, answer });
  });

  socket.on("webrtc-ice-candidate", ({ to, candidate, from }) => {
    io.to(to).emit("webrtc-ice-candidate", { from, candidate });
  });

  // ─── Game Events ──────────────────────────────────────────────────────────
  // Host starts a game round
  socket.on("game-start", ({ roomCode, gameType }) => {
    io.to(roomCode).emit("game-start", { gameType });
  });

  // Player submits their move
  socket.on("game-move", ({ roomCode, userId, move }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (!room.moves) room.moves = {};
    room.moves[userId] = move;

    const players = Array.from(room.members.values()).filter((m) => m.role === "PLAYER");
    const allMoved = players.every((p) => room.moves[p.userId] !== undefined);

    if (allMoved) {
      // Broadcast all moves so clients can compute the result
      io.to(roomCode).emit("game-moves-complete", { moves: room.moves });
      room.moves = {};
    }
  });

  // Host broadcasts the result (loser + punishment)
  socket.on("game-result", ({ roomCode, loserId, loserName, punishment }) => {
    io.to(roomCode).emit("game-result", { loserId, loserName, punishment });
  });

  // ─── Chat / Reactions ─────────────────────────────────────────────────────
  socket.on("reaction", ({ roomCode, userId, userName, emoji }) => {
    io.to(roomCode).emit("reaction", { userId, userName, emoji });
  });

  // ─── Disconnect ────────────────────────────────────────────────────────────
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

httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
