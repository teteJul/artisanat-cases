import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceTypeId = searchParams.get("serviceTypeId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Le planning est ouvert 2 mois à l'avance
  const now = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);

  const slots = await prisma.courseSlot.findMany({
    where: {
      ...(serviceTypeId ? { serviceTypeId } : {}),
      startTime: {
        gte: from ? new Date(from) : now,
        lte: to ? new Date(to) : maxDate,
      },
      isActive: true,
      isCancelled: false,
    },
    include: {
      serviceType: true,
      bookings: {
        where: { status: { notIn: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ADMIN"] } },
        select: { id: true, participants: { select: { id: true } } },
      },
      waitlists: { select: { id: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const slotsWithAvailability = slots.map((slot) => {
    const bookedCount = slot.bookings.length;
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
