import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceTypeId = searchParams.get("serviceTypeId");
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const fromDate = fromStr ? new Date(fromStr) : null;
  const toDate = toStr ? new Date(toStr) : null;

  if (fromDate && isNaN(fromDate.getTime())) {
    return NextResponse.json({ error: "Paramètre 'from' invalide" }, { status: 400 });
  }
  if (toDate && isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "Paramètre 'to' invalide" }, { status: 400 });
  }

  // Le planning est ouvert 2 mois à l'avance
  const now = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);

  const slots = await prisma.courseSlot.findMany({
    where: {
      ...(serviceTypeId ? { serviceTypeId } : {}),
      startTime: {
        gte: fromDate ?? now,
        lte: toDate ?? maxDate,
      },
      isActive: true,
      isCancelled: false,
    },
    include: {
      serviceType: true,
      bookings: {
        where: {
          OR: [
            { status: { notIn: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ADMIN", "PENDING"] } },
            // PENDING récents (< 30 min) comptent pour éviter la surréservation
            {
              status: "PENDING",
              createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
            },
          ],
        },
        select: { id: true, participants: { select: { id: true } } },
      },
      waitlists: { select: { id: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const slotsWithAvailability = slots.map((slot) => {
    const bookedCount = slot.bookings.reduce((acc, b) => acc + b.participants.length, 0);
    const availableSpots = slot.maxParticipants - bookedCount;
    return {
      id: slot.id,
      serviceTypeId: slot.serviceTypeId,
      serviceType: slot.serviceType,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxParticipants: slot.maxParticipants,
      bookedCount,
      availableSpots,
      isFull: availableSpots <= 0,
      waitlistCount: slot.waitlists.length,
    };
  });

  return NextResponse.json(slotsWithAvailability);
}
