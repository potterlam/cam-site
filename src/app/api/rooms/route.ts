import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GameType } from "@/generated/prisma/client";

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const createRoomSchema = z.object({
  gameType: z.enum(["DICE_COMPARE", "ROCK_PAPER_SCISSORS", "ROULETTE"]),
  punishmentSetId: z.string().optional(),
  maxPlayers: z.number().int().min(1).max(6).default(6),
  maxSpectators: z.number().int().min(0).default(100),
});

// GET /api/rooms — list public rooms
export async function GET() {
  const rooms = await db.room.findMany({
    where: { status: { in: ["WAITING", "PLAYING"] } },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      members: { select: { role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(rooms);
}

// POST /api/rooms — create a room
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createRoomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { gameType, punishmentSetId, maxPlayers, maxSpectators } = parsed.data;

  // Generate unique room code
  let code = generateRoomCode();
  while (await db.room.findUnique({ where: { code } })) {
    code = generateRoomCode();
  }

  const room = await db.room.create({
    data: {
      code,
      creatorId: session.user.id,
      gameType: gameType as GameType,
      punishmentSetId,
      maxPlayers,
      maxSpectators,
    },
  });

  // Creator joins as first player
  await db.roomMember.create({
    data: {
      roomId: room.id,
      userId: session.user.id,
      role: "PLAYER",
    },
  });

  return NextResponse.json(room, { status: 201 });
}
