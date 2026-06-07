import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { resend, EMAIL_FROM } from "@/lib/resend";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const { reason, action } = await req.json(); // action: "refund" | "credit"

  const slot = await prisma.courseSlot.findUnique({
    where: { id },
    include: {
      serviceType: true,
      bookings: {
        where: { status: "CONFIRMED" },
        include: { user: true, participants: true },
      },
    },
  });

  if (!slot) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

  // Annuler le créneau
  await prisma.courseSlot.update({
    where: { id },
    data: { isCancelled: true, cancelReason: reason },
  });

  // Traiter chaque réservation confirmée
  for (const booking of slot.bookings) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED_BY_ADMIN" },
    });

    if (action === "refund" && booking.stripePaymentId && Number(booking.amountPaid) > 0) {
      await stripe.refunds.create({ payment_intent: booking.stripePaymentId });
      await prisma.booking.update({ where: { id: booking.id }, data: { paymentStatus: "REFUNDED" } });
    } else if (action === "credit" && Number(booking.amountPaid) > 0) {
      await prisma.credit.create({
        data: {
          userId: booking.userId,
          amount: booking.amountPaid!,
          reason: "admin_slot_cancellation",
          bookingId: booking.id,
        },
      });
    }

    // Rembourser carnet/abonnement
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

    // Email client
    const slotDate = new Date(slot.startTime);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: booking.user.email,
      subject: `Cours annulé — ${slot.serviceType.name}`,
      html: `
        <p>Bonjour ${booking.user.firstName ?? booking.user.name},</p>
        <p>Nous vous informons que le cours de <strong>${slot.serviceType.name}</strong> du
        <strong>${slotDate.toLocaleDateString("fr-FR")}</strong> à
        <strong>${slotDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</strong>
        a été annulé.</p>
        ${reason ? `<p>Raison : ${reason}</p>` : ""}
        <p>${action === "refund" ? "Un remboursement a été initié sur votre carte." : action === "credit" ? "Un avoir a été crédité sur votre compte." : ""}</p>
        <p>Nous nous excusons pour la gêne occasionnée.</p>
        <p>L'équipe Artisanat Cases</p>
      `,
    });
  }

  return NextResponse.json({ success: true, cancelledBookings: slot.bookings.length });
}
