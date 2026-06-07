import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { canCancelBooking } from "@/lib/utils";
import { resend, EMAIL_FROM } from "@/lib/resend";
import WaitlistNotificationEmail from "@/../emails/waitlist-notification";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json(); // "credit" | "refund" | "reschedule"

  const booking = await prisma.booking.findFirst({
    where: { id, userId: session.user.id },
    include: { slot: { include: { serviceType: true } }, participants: true },
  });

  if (!booking) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  if (booking.status === "CANCELLED_BY_CLIENT") {
    return NextResponse.json({ error: "Déjà annulée" }, { status: 400 });
  }

  const canCancel = canCancelBooking(booking.slot.startTime);

  await prisma.booking.update({
    where: { id },
    data: {
      status: "CANCELLED_BY_CLIENT",
      cancelledAt: new Date(),
      cancelReason: canCancel ? "client_request" : "late_cancellation",
    },
  });

  // Rembourser ou créditer seulement si annulation > 48h
  if (canCancel && Number(booking.amountPaid) > 0) {
    if (action === "refund" && booking.stripePaymentId) {
      await stripe.refunds.create({ payment_intent: booking.stripePaymentId });
      await prisma.booking.update({ where: { id }, data: { paymentStatus: "REFUNDED" } });
    } else if (action === "credit") {
      await prisma.credit.create({
        data: {
          userId: session.user.id,
          amount: booking.amountPaid!,
          reason: "cancellation_refund",
          bookingId: id,
        },
      });
      await prisma.booking.update({ where: { id }, data: { creditIssued: true } });
    }

    // Remettre le crédit carnet/abonnement
    if (booking.carnetId) {
      await prisma.carnet.update({
        where: { id: booking.carnetId },
        data: { usedCredits: { decrement: booking.participants.length } },
      });
    }
    if (booking.subscriptionId) {
      await prisma.subscription.update({
        where: { id: booking.subscriptionId },
        data: { remainingCredits: { increment: 1 } },
      });
    }
  }

  // Notifier la liste d'attente
  const waitlist = await prisma.waitlist.findMany({
    where: { courseSlotId: booking.courseSlotId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  if (waitlist.length > 0) {
    const slotDate = new Date(booking.slot.startTime);
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reserver/${booking.courseSlotId}`;

    for (const entry of waitlist) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: entry.user.email,
        subject: `Une place s'est libérée — ${booking.slot.serviceType.name}`,
        react: WaitlistNotificationEmail({
          clientName: entry.user.firstName ?? entry.user.name ?? "Client",
          serviceName: booking.slot.serviceType.name,
          date: slotDate.toLocaleDateString("fr-FR"),
          time: slotDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          bookingUrl,
        }),
      });
      await prisma.waitlist.update({ where: { id: entry.id }, data: { notifiedAt: new Date() } });
    }
  }

  return NextResponse.json({ success: true, refundEligible: canCancel });
}
