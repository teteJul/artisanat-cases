import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { canCancelBooking } from "@/lib/utils";
import { resend, EMAIL_FROM } from "@/lib/resend";
import WaitlistNotificationEmail from "@/../emails/waitlist-notification";

const TERMINAL_STATUSES = ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ADMIN", "COMPLETED", "NO_SHOW"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json(); // "credit" | "refund"

  const booking = await prisma.booking.findFirst({
    where: { id, userId: session.user.id },
    include: { slot: { include: { serviceType: true } }, participants: true, user: true },
  });

  if (!booking) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  if (TERMINAL_STATUSES.includes(booking.status)) {
    return NextResponse.json({ error: "Cette réservation ne peut plus être annulée" }, { status: 400 });
  }

  const deadlineSetting = await prisma.appSetting.findUnique({ where: { key: "cancellation_deadline_hours" } });
  const deadlineHours = deadlineSetting ? parseInt(deadlineSetting.value) : 48;
  const canCancel = canCancelBooking(booking.slot.startTime, deadlineHours);
  const amountPaid = Number(booking.amountPaid ?? 0);

  // Pour un remboursement Stripe : tenter d'abord avant de modifier le booking
  if (canCancel && action === "refund" && booking.stripePaymentId && amountPaid > 0) {
    try {
      await stripe.refunds.create({ payment_intent: booking.stripePaymentId });
    } catch (e) {
      console.error("[cancel] Stripe refund échoué:", e);
      return NextResponse.json({ error: "Le remboursement a échoué. Contactez l'atelier." }, { status: 502 });
    }
  }

  // Annuler le booking
  await prisma.booking.update({
    where: { id },
    data: {
      status: "CANCELLED_BY_CLIENT",
      cancelledAt: new Date(),
      cancelReason: canCancel ? "client_request" : "late_cancellation",
      ...(action === "refund" && booking.stripePaymentId && amountPaid > 0 ? { paymentStatus: "REFUNDED" } : {}),
    },
  });

  if (canCancel) {
    // Avoir si paiement Stripe et action === "credit"
    if (action === "credit" && amountPaid > 0) {
      await prisma.credit.create({
        data: {
          userId: session.user.id,
          amount: amountPaid,
          reason: "cancellation_refund",
          bookingId: id,
        },
      });
      await prisma.booking.update({ where: { id }, data: { creditIssued: true } });
    }

    // Restituer les avoirs consommés (paiement par crédit : amountPaid = 0 mais crédits débités)
    if (booking.paymentMethod === "CREDIT") {
      const isFixed = booking.slot.serviceType.pricingType === "FIXED";
      const unitPrice = Number(booking.slot.serviceType.price);
      const creditAmount = isFixed ? unitPrice : unitPrice * booking.participants.length;
      if (creditAmount > 0) {
        await prisma.credit.create({
          data: {
            userId: session.user.id,
            amount: creditAmount,
            reason: "cancellation_refund",
            bookingId: id,
          },
        });
      }
    }

    // Restituer le crédit carnet (usedCredits ne peut pas descendre sous 0)
    if (booking.carnetId) {
      const isFixed = booking.slot.serviceType.pricingType === "FIXED";
      const creditsToRestore = isFixed ? 1 : booking.participants.length;
      const carnet = await prisma.carnet.findUnique({ where: { id: booking.carnetId } });
      if (carnet) {
        await prisma.carnet.update({
          where: { id: booking.carnetId },
          data: { usedCredits: Math.max(0, carnet.usedCredits - creditsToRestore) },
        });
      }
    }

    // Restituer le crédit abonnement
    if (booking.subscriptionId) {
      await prisma.subscription.update({
        where: { id: booking.subscriptionId },
        data: { remainingCredits: { increment: 1 } },
      });
    }

    // Remettre le bon cadeau en ACTIVE
    if (booking.giftVoucherId) {
      await prisma.giftVoucher.update({
        where: { id: booking.giftVoucherId },
        data: { status: "ACTIVE", redeemedAt: null },
      }).catch(() => {});
    }
  }

  // Email d'annulation au client
  const slotDateForEmail = new Date(booking.slot.startTime);
  resend.emails.send({
    from: EMAIL_FROM,
    to: booking.user.email,
    subject: `Annulation de votre réservation — ${booking.slot.serviceType.name}`,
    html: `
      <h2>Votre réservation a été annulée</h2>
      <p>Bonjour ${booking.user.firstName ?? booking.user.name ?? "Client"},</p>
      <p>Votre réservation pour <strong>${booking.slot.serviceType.name}</strong> du <strong>${slotDateForEmail.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })} à ${slotDateForEmail.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}</strong> a bien été annulée.</p>
      ${canCancel && amountPaid > 0
        ? action === "refund"
          ? "<p>Un remboursement a été initié sur votre carte bancaire (3-5 jours ouvrés).</p>"
          : action === "credit"
          ? `<p>Un crédit de ${amountPaid.toFixed(2)} € a été ajouté à votre compte.</p>`
          : ""
        : canCancel && booking.carnetId
        ? "<p>Votre crédit carnet a été restitué.</p>"
        : canCancel && booking.subscriptionId
        ? "<p>Votre crédit abonnement a été restitué.</p>"
        : canCancel && booking.giftVoucherId
        ? "<p>Votre bon cadeau a été restitué.</p>"
        : !canCancel && amountPaid > 0
        ? `<p>Cette annulation étant tardive (moins de ${deadlineHours}h avant le cours), aucun remboursement ne sera effectué.</p>`
        : !canCancel && booking.carnetId
        ? `<p>Cette annulation étant tardive (moins de ${deadlineHours}h avant le cours), votre crédit carnet n'a pas été restitué.</p>`
        : !canCancel && booking.subscriptionId
        ? `<p>Cette annulation étant tardive (moins de ${deadlineHours}h avant le cours), votre crédit abonnement n'a pas été restitué.</p>`
        : ""
      }
      <p style="color:#9a6b50;font-size:13px;">— L'équipe Artisanat Cases</p>
    `,
  }).catch((e) => console.error("[cancel] Email échoué:", e));

  // Notifier le premier de la liste d'attente
  const nextOnWaitlist = await prisma.waitlist.findFirst({
    where: { courseSlotId: booking.courseSlotId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  if (nextOnWaitlist) {
    const slotDate = new Date(booking.slot.startTime);
    const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reserver?slotId=${booking.courseSlotId}&serviceId=${booking.slot.serviceType.id ?? ""}`;
    resend.emails.send({
      from: EMAIL_FROM,
      to: nextOnWaitlist.user.email,
      subject: `Une place s'est libérée — ${booking.slot.serviceType.name}`,
      react: WaitlistNotificationEmail({
        clientName: nextOnWaitlist.user.firstName ?? nextOnWaitlist.user.name ?? "Client",
        serviceName: booking.slot.serviceType.name,
        date: slotDate.toLocaleDateString("fr-FR"),
        time: slotDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }),
        bookingUrl,
      }),
    }).catch((e) => console.error("[cancel] Email waitlist échoué:", e));
    await prisma.waitlist.update({ where: { id: nextOnWaitlist.id }, data: { notifiedAt: new Date() } });
  }

  return NextResponse.json({ success: true, refundEligible: canCancel });
}
