import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const data = await req.json();
  const slot = await prisma.courseSlot.update({ where: { id }, data });
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
