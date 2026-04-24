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
