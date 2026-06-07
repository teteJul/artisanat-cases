import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ReservationsAdmin } from "@/components/admin/reservations-admin";

export const metadata: Metadata = { title: "Admin — Réservations" };

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();

  const [bookings, waitlists] = await Promise.all([
    prisma.booking.findMany({
      where: { slot: { startTime: { gte: now } } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        slot: { include: { serviceType: true } },
        participants: true,
      },
      orderBy: { slot: { startTime: "asc" } },
      take: 200,
    }),
    prisma.waitlist.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        slot: { include: { serviceType: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const serialized = bookings.map((b) => ({
    ...b,
    amountPaid: b.amountPaid ? Number(b.amountPaid) : null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    cancelledAt: b.cancelledAt?.toISOString() ?? null,
    slot: {
      ...b.slot,
      startTime: b.slot.startTime.toISOString(),
      endTime: b.slot.endTime.toISOString(),
      serviceType: { ...b.slot.serviceType, price: Number(b.slot.serviceType.price) },
    },
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Réservations</h1>
        <p className="text-muted-foreground mt-1">Toutes les réservations à venir et listes d'attente.</p>
      </div>
      <ReservationsAdmin
        bookings={serialized}
        waitlists={waitlists.map((w) => ({
          ...w,
          createdAt: w.createdAt.toISOString(),
          slot: { ...w.slot, startTime: w.slot.startTime.toISOString(), endTime: w.slot.endTime.toISOString() },
        }))}
        defaultTab={params.tab}
      />
    </div>
  );
}
