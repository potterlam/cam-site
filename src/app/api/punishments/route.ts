import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/punishments — list all punishment sets
export async function GET() {
  const sets = await db.punishmentSet.findMany({
    include: { punishments: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(sets);
}

// POST /api/punishments — create a new punishment set
// ─────────────────────────────────────────────────────────────────────────────
// TO ADD YOUR OWN PUNISHMENT SETS:
// Send a POST request with this body:
// {
//   "name": "My Set Name",
//   "description": "Optional description",
//   "punishments": [
//     { "description": "Drink a shot", "severity": 2, "order": 1 },
//     { "description": "Do 10 push-ups", "severity": 1, "order": 2 },
//     { "description": "Your custom punishment here", "severity": 3, "order": 3 }
//   ]
// }
// Severity: 1 = mild, 2 = medium, 3 = spicy
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, punishments } = await req.json();

  if (!name || !Array.isArray(punishments)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const set = await db.punishmentSet.create({
    data: {
      name,
      description,
      punishments: {
        create: punishments.map((p: { description: string; severity?: number; order?: number }) => ({
          description: p.description,
          severity: p.severity ?? 1,
          order: p.order ?? 0,
        })),
      },
    },
    include: { punishments: true },
  });

  return NextResponse.json(set, { status: 201 });
}
