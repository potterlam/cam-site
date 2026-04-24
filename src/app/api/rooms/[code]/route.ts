import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ code: string }> };

// GET /api/rooms/[code]
export async function GET(_req: NextRequest, { params }: Params) {
  const { code } = await params;
  const room = await db.room.findUnique({
    where: { code },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      gameRounds: { orderBy: { roundNumber: "desc" }, take: 5 },
    },
  });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(room);
}

// POST /api/rooms/[code]/join
export async function POST(req: NextRequest, { params }: Params) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role = "SPECTATOR" } = await req.json().catch(() => ({}));

  const room = await db.room.findUnique({
    where: { code },
    include: { members: true },
  });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status === "FINISHED") {
    return NextResponse.json({ error: "Room has ended" }, { status: 400 });
  }

  const playerCount = room.members.filter((m) => m.role === "PLAYER").length;
  const spectatorCount = room.members.filter((m) => m.role === "SPECTATOR").length;

  if (role === "PLAYER" && playerCount >= room.maxPlayers) {
    return NextResponse.json({ error: "Room is full" }, { status: 400 });
  }
  if (role === "SPECTATOR" && spectatorCount >= room.maxSpectators) {
    return NextResponse.json({ error: "Spectator limit reached" }, { status: 400 });
  }

  const member = await db.roomMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
    update: {},
    create: { roomId: room.id, userId: session.user.id, role },
  });

  return NextResponse.json(member);
}

// PATCH /api/rooms/[code] — change role or close room
export async function PATCH(req: NextRequest, { params }: Params) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const room = await db.room.findUnique({
    where: { code },
    include: { members: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  // Close room — only creator
  if (body.action === "close") {
    if (room.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Only the host can close the room." }, { status: 403 });
    }
    await db.room.update({ where: { code }, data: { status: "FINISHED" } });
    return NextResponse.json({ ok: true, closed: true });
  }

  // Change role (PLAYER ↔ SPECTATOR)
  if (body.role === "PLAYER" || body.role === "SPECTATOR") {
    if (body.role === "PLAYER") {
      const playerCount = room.members.filter((m) => m.role === "PLAYER").length;
      if (playerCount >= room.maxPlayers) {
        return NextResponse.json({ error: "Player slots are full." }, { status: 400 });
      }
    }
    const updated = await db.roomMember.update({
      where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
      data: { role: body.role },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}

// DELETE /api/rooms/[code] — leave room; auto-close if everyone left or only spectators remain
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const room = await db.room.findUnique({
    where: { code },
    include: { members: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  await db.roomMember.deleteMany({
    where: { roomId: room.id, userId: session.user.id },
  });

  // Auto-close if no players remain
  const remaining = room.members.filter((m) => m.userId !== session.user.id);
  const playersLeft = remaining.filter((m) => m.role === "PLAYER").length;
  if (playersLeft === 0) {
    await db.room.update({ where: { code }, data: { status: "FINISHED" } });
  }

  return NextResponse.json({ ok: true });
}
