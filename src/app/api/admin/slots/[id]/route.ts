import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
  isCancelled: z.boolean().optional(),
  cancelReason: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const slot = await prisma.courseSlot.update({ where: { id }, data: parsed.data });
  return NextResponse.json(slot);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const { maxParticipants } = await req.json();

  // Compter les participants réels (pas les bookings) pour la vérification
  const bookings = await prisma.booking.findMany({
    where: { courseSlotId: id, status: "CONFIRMED" },
    include: { participants: { select: { id: true } } },
  });
  const bookedParticipants = bookings.reduce((acc, b) => acc + b.participants.length, 0);

  if (maxParticipants < bookedParticipants) {
    return NextResponse.json(
      { error: `Impossible : ${bookedParticipants} participant(s) confirmé(s) sur ce créneau.` },
      { status: 400 }
    );
  }

  const slot = await prisma.courseSlot.update({
    where: { id },
    data: { maxParticipants },
  });

  return NextResponse.json(slot);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  // Vérifie qu'il n'y a pas de réservations confirmées
  const bookingCount = await prisma.booking.count({
    where: { courseSlotId: id, status: "CONFIRMED" },
  });
  if (bookingCount > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer un créneau avec des réservations confirmées. Annulez-le plutôt." },
      { status: 400 }
    );
  }

  await prisma.courseSlot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
