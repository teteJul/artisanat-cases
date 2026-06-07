import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { resend, EMAIL_FROM } from "@/lib/resend";
import BookingConfirmationEmail from "@/../emails/booking-confirmation";
import { z } from "zod";
import { canCancelBooking } from "@/lib/utils";

const createBookingSchema = z.object({
  courseSlotId: z.string(),
  paymentMethod: z.enum(["STRIPE", "CARNET", "SUBSCRIPTION", "GIFT_VOUCHER", "CREDIT"]),
  participants: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    age: z.number().optional(),
  })).min(1),
  carnetId: z.string().optional(),
  subscriptionId: z.string().optional(),
  giftVoucherId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { courseSlotId, paymentMethod, participants, carnetId, subscriptionId, giftVoucherId, notes } = parsed.data;

  // Vérifier le créneau
  const slot = await prisma.courseSlot.findUnique({
    where: { id: courseSlotId },
    include: { serviceType: true, bookings: { where: { status: { not: "CANCELLED_BY_CLIENT" } } } },
  });

  if (!slot || !slot.isActive || slot.isCancelled) {
    return NextResponse.json({ error: "Créneau non disponible" }, { status: 400 });
  }

  // Vérifier le planning ouvert à 2 mois maximum
  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
  if (slot.startTime > twoMonthsFromNow) {
    return NextResponse.json({ error: "Ce créneau n'est pas encore ouvert à la réservation" }, { status: 400 });
  }

  // Compter les places restantes
  const bookedCount = slot.bookings.reduce((acc, b) => {
    // compter les participants de chaque booking
    return acc + 1;
  }, 0);

  const participantCount = participants.length;

  if (bookedCount + participantCount > slot.maxParticipants) {
    // Proposer la liste d'attente
    return NextResponse.json(
      { error: "Plus assez de places disponibles", canWaitlist: true },
      { status: 409 }
    );
  }

  const serviceType = slot.serviceType;
  const unitPrice = Number(serviceType.price);

  // Calculer le prix total
  let totalAmount = 0;

  if (paymentMethod === "CARNET") {
    if (!carnetId) return NextResponse.json({ error: "Carnet requis" }, { status: 400 });
    const carnet = await prisma.carnet.findFirst({
      where: { id: carnetId, userId: session.user.id, isActive: true },
    });
    if (!carnet || carnet.usedCredits + participantCount > carnet.totalCredits) {
      return NextResponse.json({ error: "Carnet insuffisant" }, { status: 400 });
    }
    // Déduire les crédits
    await prisma.carnet.update({
      where: { id: carnetId },
      data: { usedCredits: { increment: participantCount } },
    });
    totalAmount = 0;
  } else if (paymentMethod === "SUBSCRIPTION") {
    if (!subscriptionId) return NextResponse.json({ error: "Abonnement requis" }, { status: 400 });
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id, status: "ACTIVE" },
    });
    if (!subscription || subscription.remainingCredits < 1) {
      return NextResponse.json({ error: "Abonnement insuffisant" }, { status: 400 });
    }
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { remainingCredits: { decrement: 1 } },
    });
    // Participants supplémentaires payés à l'unité
    totalAmount = unitPrice * (participantCount - 1);
  } else if (paymentMethod === "GIFT_VOUCHER") {
    if (!giftVoucherId) return NextResponse.json({ error: "Bon cadeau requis" }, { status: 400 });
    const voucher = await prisma.giftVoucher.findFirst({
      where: { id: giftVoucherId, status: "ACTIVE" },
    });
    if (!voucher) return NextResponse.json({ error: "Bon cadeau invalide ou déjà utilisé" }, { status: 400 });
    const voucherValue = Number(voucher.amountValue ?? 0);
    const fullPrice = unitPrice * participantCount;
    totalAmount = Math.max(0, fullPrice - voucherValue);
  } else if (paymentMethod === "STRIPE") {
    totalAmount = unitPrice * participantCount;
  }

  const needsStripePayment = totalAmount > 0;

  // Créer la réservation en base
  const booking = await prisma.booking.create({
    data: {
      userId: session.user.id,
      courseSlotId,
      status: needsStripePayment ? "PENDING" : "CONFIRMED",
      paymentMethod,
      paymentStatus: needsStripePayment ? "PENDING" : "PAID",
      amountPaid: totalAmount,
      carnetId,
      subscriptionId,
      giftVoucherId,
      notes,
      participants: {
        create: participants.map((p, i) => ({ ...p, isMainBooker: i === 0 })),
      },
    },
  });

  // Bon cadeau gratuit (0€) → marquer comme utilisé immédiatement
  if (paymentMethod === "GIFT_VOUCHER" && giftVoucherId && !needsStripePayment) {
    await prisma.giftVoucher.update({
      where: { id: giftVoucherId },
      data: { status: "REDEEMED", redeemedAt: new Date() },
    });
  }

  // Si paiement Stripe nécessaire (STRIPE ou GIFT_VOUCHER partiel), créer une session
  if (needsStripePayment) {
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: serviceType.name,
              description: `${participants.length} participant(s) — ${new Date(slot.startTime).toLocaleDateString("fr-FR")}`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/mon-espace/reservations?success=true&bookingId=${booking.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/reserver?cancelled=true`,
      metadata: {
        bookingId: booking.id,
        giftVoucherId: giftVoucherId ?? "",
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: stripeSession.id },
    });

    return NextResponse.json({ checkoutUrl: stripeSession.url, bookingId: booking.id });
  }

  // Réservation confirmée sans paiement → envoyer email de confirmation
  const fullBooking = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: {
      user: true,
      slot: { include: { serviceType: true } },
      participants: true,
    },
  });

  if (fullBooking) {
    const slotDate = new Date(fullBooking.slot.startTime);
    resend.emails.send({
      from: EMAIL_FROM,
      to: fullBooking.user.email,
      subject: `Confirmation de votre réservation — ${fullBooking.slot.serviceType.name}`,
      react: BookingConfirmationEmail({
        clientName: fullBooking.user.firstName ?? fullBooking.user.name ?? "Client",
        serviceName: fullBooking.slot.serviceType.name,
        date: slotDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
        time: slotDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        bookingId: fullBooking.id,
        participants: fullBooking.participants,
        paymentMethod: paymentMethod === "GIFT_VOUCHER" ? "Bon cadeau" : paymentMethod === "CARNET" ? "Carnet" : "Abonnement",
        totalPaid: `${Number(fullBooking.amountPaid).toFixed(2)} €`,
        appUrl: process.env.NEXT_PUBLIC_APP_URL!,
      }),
    }).catch((e) => console.error("[bookings] Email échoué:", e));
  }

  return NextResponse.json({ bookingId: booking.id, status: "confirmed" });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      slot: { include: { serviceType: true } },
      participants: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}
