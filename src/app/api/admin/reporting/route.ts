import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const monthsBack = parseInt(searchParams.get("months") ?? "6");

  const now = new Date();
  const periodStart = startOfMonth(subMonths(now, monthsBack - 1));

  // CA total et par mois
  const monthlyRevenue = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const month = subMonths(now, i);
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const bookings = await prisma.booking.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: start, lte: end },
      },
      select: { amountPaid: true },
    });

    const revenue = bookings.reduce((sum, b) => sum + Number(b.amountPaid ?? 0), 0);

    monthlyRevenue.push({
      month: month.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
      revenue,
      bookingCount: bookings.length,
    });
  }

  // Taux de remplissage par service
  const slots = await prisma.courseSlot.findMany({
    where: { startTime: { gte: periodStart } },
    include: {
      serviceType: true,
      bookings: { where: { status: { notIn: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ADMIN"] } } },
    },
  });

  const fillRateByService: Record<string, { name: string; totalSlots: number; avgFillRate: number }> = {};
  for (const slot of slots) {
    const key = slot.serviceTypeId;
    if (!fillRateByService[key]) {
      fillRateByService[key] = { name: slot.serviceType.name, totalSlots: 0, avgFillRate: 0 };
    }
    const rate = (slot.bookings.length / slot.maxParticipants) * 100;
    fillRateByService[key].totalSlots++;
    fillRateByService[key].avgFillRate += rate;
  }
  for (const key of Object.keys(fillRateByService)) {
    fillRateByService[key].avgFillRate = Math.round(
      fillRateByService[key].avgFillRate / fillRateByService[key].totalSlots
    );
  }

  // Stats générales
  const [totalClients, activeSubscriptions, activeCarnets, pendingWaitlists] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.carnet.count({ where: { isActive: true } }),
    prisma.waitlist.count(),
  ]);

  // Réservations du mois en cours
  const currentMonthBookings = await prisma.booking.findMany({
    where: {
      createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
      status: { notIn: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ADMIN"] },
    },
    include: { slot: { include: { serviceType: true } } },
  });

  const revenueThisMonth = currentMonthBookings.reduce(
    (sum, b) => sum + Number(b.amountPaid ?? 0),
    0
  );

  // Carnets expirant dans 30 jours
  const expiringCarnets = await prisma.carnet.findMany({
    where: {
      isActive: true,
      expiresAt: {
        gte: now,
        lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  return NextResponse.json({
    monthlyRevenue,
    fillRateByService: Object.values(fillRateByService),
    summary: {
      totalClients,
      activeSubscriptions,
      activeCarnets,
      pendingWaitlists,
      revenueThisMonth,
      bookingsThisMonth: currentMonthBookings.length,
    },
    expiringCarnets,
  });
}
