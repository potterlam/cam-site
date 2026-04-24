import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ code: string }> };

const resultSchema = z.object({
  gameType: z.enum(["DICE_COMPARE", "ROCK_PAPER_SCISSORS", "ROULETTE"]),
  result: z.any(),
  loserId: z.string().optional(),
  punishment: z.string().optional(),
});

// POST /api/rooms/[code]/round — save a completed game round
export async function POST(req: NextRequest, { params }: Params) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const room = await db.room.findUnique({ where: { code } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const body = await req.json();
  const parsed = resultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const lastRound = await db.gameRound.findFirst({
    where: { roomId: room.id },
    orderBy: { roundNumber: "desc" },
  });

  const round = await db.gameRound.create({
    data: {
      roomId: room.id,
      roundNumber: (lastRound?.roundNumber ?? 0) + 1,
      gameType: parsed.data.gameType,
      result: parsed.data.result,
      loserId: parsed.data.loserId,
      punishment: parsed.data.punishment,
      completedAt: new Date(),
    },
  });

  return NextResponse.json(round, { status: 201 });
}
