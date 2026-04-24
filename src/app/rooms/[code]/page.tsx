import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import RoomClient, { type RoomData } from "@/components/RoomClient";

type Props = { params: Promise<{ code: string }> };

export default async function RoomPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { code } = await params;

  const room = await db.room.findUnique({
    where: { code },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!room) return <div className="p-8 text-center text-gray-400">Room not found.</div>;

  // Auto-join as spectator if not already a member
  const isMember = room.members.some((m) => m.userId === session.user!.id);
  if (!isMember) {
    await db.roomMember.create({
      data: { roomId: room.id, userId: session.user!.id, role: "SPECTATOR" },
    });
    room.members.push({
      userId: session.user!.id,
      role: "SPECTATOR",
      roomId: room.id,
      id: "",
      joinedAt: new Date(),
      user: {
        id: session.user!.id,
        name: session.user!.name ?? null,
        image: session.user!.image ?? null,
      },
    });
  }

  // Fetch punishment set if configured
  const punishments = room.punishmentSetId
    ? await db.punishment.findMany({ where: { setId: room.punishmentSetId }, orderBy: { order: "asc" } })
    : [];

  return (
    <RoomClient
      roomCode={code}
      initialRoom={room as unknown as RoomData}
      punishments={punishments}
    />
  );
}
