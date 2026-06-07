import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  const [user, bookings, carnets, subscriptions, credits, vouchers] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { userId: id },
      include: { slot: { include: { serviceType: true } }, participants: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.carnet.findMany({
      where: { userId: id },
      include: { serviceType: true },
      orderBy: { purchasedAt: "desc" },
    }),
    prisma.subscription.findMany({
      where: { userId: id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.credit.findMany({
      where: { userId: id, usedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.giftVoucher.findMany({
      where: { ownerId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  return NextResponse.json({
    user,
    bookings: bookings.map((b) => ({
      ...b,
      amountPaid: b.amountPaid ? Number(b.amountPaid) : null,
      slot: { ...b.slot, serviceType: { ...b.slot.serviceType, price: Number(b.slot.serviceType.price) } },
    })),
    carnets: carnets.map((c) => ({ ...c, serviceType: { ...c.serviceType, price: Number(c.serviceType.price) } })),
    subscriptions: subscriptions.map((s) => ({ ...s, plan: { ...s.plan, price: Number(s.plan.price) } })),
    credits: credits.map((c) => ({ ...c, amount: Number(c.amount) })),
    vouchers: vouchers.map((v) => ({ ...v, amountValue: v.amountValue ? Number(v.amountValue) : null })),
    totalCredit: credits.reduce((sum, c) => sum + Number(c.amount), 0),
  });
}
