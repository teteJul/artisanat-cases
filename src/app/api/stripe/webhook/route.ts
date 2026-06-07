import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import BookingConfirmationEmail from "@/../emails/booking-confirmation";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  console.log("[webhook] Reçu — signature:", signature?.slice(0, 30));

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log("[webhook] Événement validé:", event.type);
  } catch (err) {
    console.error("[webhook] Signature invalide:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const bookingId = checkoutSession.metadata?.bookingId;
    const metaGiftVoucherId = checkoutSession.metadata?.giftVoucherId;
    if (!bookingId) return NextResponse.json({ received: true });

    const booking = await prisma.booking.update({
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

    const slotDate = new Date(booking.slot.startTime);

    await resend.emails.send({
      from: EMAIL_FROM,
      to: booking.user.email,
      subject: `Confirmation de votre réservation — ${booking.slot.serviceType.name}`,
      react: BookingConfirmationEmail({
        clientName: booking.user.firstName ?? booking.user.name ?? "Client",
        serviceName: booking.slot.serviceType.name,
        date: slotDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
        time: slotDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        bookingId: booking.id,
        participants: booking.participants,
        paymentMethod: "Carte bancaire",
        totalPaid: `${Number(booking.amountPaid).toFixed(2)} €`,
        appUrl: process.env.NEXT_PUBLIC_APP_URL!,
      }),
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await prisma.booking.updateMany({
      where: { stripePaymentId: pi.id },
      data: { paymentStatus: "FAILED", status: "CANCELLED_BY_CLIENT" },
    });
  }

  return NextResponse.json({ received: true });
}
