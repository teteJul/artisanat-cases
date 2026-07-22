import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import BookingConfirmationEmail from "@/../emails/booking-confirmation";
import SubscriptionConfirmationEmail from "@/../emails/subscription-confirmation";
import VoucherConfirmationEmail from "@/../emails/voucher-confirmation";
import Stripe from "stripe";
import { computeEndDate } from "@/lib/subscriptions";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] Signature invalide:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const { bookingId, giftVoucherId: metaGiftVoucherId, subscriptionId, voucherId } = checkoutSession.metadata ?? {};

    // ── Réservation ──────────────────────────────────────────────────────────
    if (bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      // Idempotence : ne pas reconfirmer si déjà CONFIRMED
      if (booking && booking.status === "PENDING") {
        const updated = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            paymentStatus: "PAID",
            stripePaymentId: checkoutSession.payment_intent as string,
            stripeSessionId: checkoutSession.id,
          },
          include: {
            user: true,
            slot: { include: { serviceType: true } },
            participants: true,
          },
        });

        // Marquer le bon cadeau comme utilisé si paiement partiel
        if (metaGiftVoucherId) {
          await prisma.giftVoucher.update({
            where: { id: metaGiftVoucherId },
            data: { status: "REDEEMED", redeemedAt: new Date() },
          }).catch(() => {});
        }

        const slotDate = new Date(updated.slot.startTime);
        resend.emails.send({
          from: EMAIL_FROM,
          to: updated.user.email,
          subject: `Confirmation de votre réservation — ${updated.slot.serviceType.name}`,
          react: BookingConfirmationEmail({
            clientName: updated.user.firstName ?? updated.user.name ?? "Client",
            serviceName: updated.slot.serviceType.name,
            date: slotDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
            time: slotDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            bookingId: updated.id,
            participants: updated.participants,
            paymentMethod: "Carte bancaire",
            totalPaid: `${Number(updated.amountPaid).toFixed(2)} €`,
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          }),
        }).catch((e) => console.error("[webhook] Email réservation échoué:", e));
      }
    }

    // ── Abonnement ───────────────────────────────────────────────────────────
    if (subscriptionId) {
      const sub = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, user: true },
      });
      if (sub && sub.status === "PENDING") {
        // Calculer les vraies dates au moment du paiement (pas au moment de la création)
        const startDate = new Date();
        const endDate = computeEndDate(startDate, sub.plan.cycleType);

        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: "ACTIVE",
            stripePaymentId: checkoutSession.payment_intent as string,
            startDate,
            endDate,
          },
        });

        resend.emails.send({
          from: EMAIL_FROM,
          to: sub.user.email,
          subject: `Votre abonnement ${sub.plan.name} est activé`,
          react: SubscriptionConfirmationEmail({
            clientName: sub.user.firstName ?? sub.user.name ?? "Client",
            planName: sub.plan.name,
            totalCourses: sub.plan.totalCourses,
            startDate: startDate.toLocaleDateString("fr-FR"),
            endDate: endDate.toLocaleDateString("fr-FR"),
            price: `${Number(sub.plan.price).toFixed(2)} €`,
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          }),
        }).catch((e) => console.error("[webhook] Email abonnement échoué:", e));
      }
    }

    // ── Bon cadeau ───────────────────────────────────────────────────────────
    if (voucherId) {
      const voucher = await prisma.giftVoucher.findUnique({ where: { id: voucherId } });
      if (voucher && voucher.status === "PENDING") {
        await prisma.giftVoucher.update({
          where: { id: voucherId },
          data: {
            status: "ACTIVE",
            stripePaymentId: checkoutSession.payment_intent as string,
            emailSentAt: new Date(),
          },
        });

        const serviceName = voucher.description?.replace("Bon cadeau — ", "") ?? "cours";
        const expiresAt = voucher.expiresAt
          ? voucher.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
          : "1 an après l'achat";
        const recipients = [voucher.purchaserEmail!].filter(Boolean);
        if (voucher.recipientEmail && voucher.recipientEmail !== voucher.purchaserEmail) {
          recipients.push(voucher.recipientEmail);
        }

        resend.emails.send({
          from: EMAIL_FROM,
          to: recipients,
          subject: `Votre bon cadeau Artisanat Cases — Code : ${voucher.code}`,
          react: VoucherConfirmationEmail({
            purchaserName: voucher.purchaserName ?? "Client",
            serviceName,
            code: voucher.code,
            expiresAt,
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          }),
        }).catch((e) => console.error("[webhook] Email bon cadeau échoué:", e));
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await prisma.booking.updateMany({
      where: { stripePaymentId: pi.id, status: "PENDING" },
      data: { paymentStatus: "FAILED" },
    });
  }

  return NextResponse.json({ received: true });
}
