import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN" ? session : null;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { carnet: true },
  });

  if (!booking) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  if (booking.status !== "PENDING") return NextResponse.json({ error: "Seules les réservations en attente peuvent être annulées ici" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { status: "CANCELLED_BY_ADMIN" } });

    // Restituer les crédits carnet si applicable
    if (booking.carnetId) {
      const creditsUsed = booking.carnet && !booking.carnet.isActive ? 0 :
        Math.round(Number(booking.amountPaid) / 1);
      const slot = await tx.courseSlot.findUnique({
        where: { id: booking.courseSlotId },
        include: { serviceType: true },
      });
      if (slot && booking.carnetId) {
        const participantCount = await tx.bookingParticipant.count({ where: { bookingId: id } });
        const creditsToRestore = slot.serviceType.pricingType === "FIXED" ? 1 : participantCount;
        await tx.carnet.update({
          where: { id: booking.carnetId },
          data: { usedCredits: { decrement: creditsToRestore } },
        });
      }
    }
  });

  return NextResponse.json({ success: true });
}
