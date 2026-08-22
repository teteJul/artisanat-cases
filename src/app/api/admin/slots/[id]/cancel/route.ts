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
        where: { status: { in: ["CONFIRMED", "PENDING"] } },
        include: { user: true, participants: true },
      },
    },
  });

  if (!slot) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

  // ── Transaction : toutes les opérations DB atomiques ──────────────────────
  await prisma.$transaction(async (tx) => {
    // Annuler le créneau
    await tx.courseSlot.update({
      where: { id },
      data: { isCancelled: true, cancelReason: reason },
    });

    for (const booking of slot.bookings) {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED_BY_ADMIN" },
      });

      // Créer un avoir (Stripe refund est fait hors transaction)
      if (action === "credit" && booking.amountPaid && Number(booking.amountPaid) > 0) {
        await tx.credit.create({
          data: {
            userId: booking.userId,
            amount: booking.amountPaid,
            reason: "admin_slot_cancellation",
            bookingId: booking.id,
          },
        });
        await tx.booking.update({ where: { id: booking.id }, data: { creditIssued: true } });
      }

      // Restituer carnet
      if (booking.carnetId) {
        const isFixed = slot.serviceType.pricingType === "FIXED";
        const creditsToRestore = isFixed ? 1 : booking.participants.length;
        const carnet = await tx.carnet.findUnique({ where: { id: booking.carnetId } });
        if (carnet) {
          await tx.carnet.update({
            where: { id: booking.carnetId },
            data: { usedCredits: Math.max(0, carnet.usedCredits - creditsToRestore) },
          });
        }
      }

      // Restituer abonnement
      if (booking.subscriptionId) {
        await tx.subscription.update({
          where: { id: booking.subscriptionId },
          data: { remainingCredits: { increment: 1 } },
        });
      }

      // Restituer bon cadeau
      if (booking.giftVoucherId) {
        await tx.giftVoucher.update({
          where: { id: booking.giftVoucherId },
          data: { status: "ACTIVE", redeemedAt: null },
        }).catch(() => {});
      }
    }
  });

  // ── Hors transaction : Stripe + emails ────────────────────────────────────
  const slotDate = new Date(slot.startTime);

  for (const booking of slot.bookings) {
    // Remboursement Stripe (hors transaction — effet externe)
    if (action === "refund" && booking.stripePaymentId && Number(booking.amountPaid) > 0) {
      try {
        await stripe.refunds.create({ payment_intent: booking.stripePaymentId });
        await prisma.booking.update({ where: { id: booking.id }, data: { paymentStatus: "REFUNDED" } });
      } catch (e) {
        console.error(`[admin cancel] Stripe refund échoué pour booking ${booking.id}:`, e);
        // Le booking est déjà annulé — l'admin doit rembourser manuellement
      }
    }

    // Email client
    await resend.emails.send({
      from: EMAIL_FROM,
      to: booking.user.email,
      subject: `Cours annulé — ${slot.serviceType.name}`,
      html: `
        <p>Bonjour ${booking.user.firstName ?? booking.user.name},</p>
        <p>Nous vous informons que le cours de <strong>${slot.serviceType.name}</strong> du
        <strong>${slotDate.toLocaleDateString("fr-FR")}</strong> à
        <strong>${slotDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}</strong>
        a été annulé.</p>
        ${reason ? `<p>Raison : ${reason}</p>` : ""}
        <p>${action === "refund" ? "Un remboursement a été initié sur votre carte." : action === "credit" ? "Un avoir a été crédité sur votre compte." : ""}</p>
        <p>Nous nous excusons pour la gêne occasionnée.</p>
        <p>L'équipe Artisanat Cases</p>
      `,
    }).catch((e) => console.error(`[admin cancel] Email échoué pour ${booking.user.email}:`, e));
  }

  return NextResponse.json({ success: true, cancelledBookings: slot.bookings.length });
}
