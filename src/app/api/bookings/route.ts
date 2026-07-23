import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { resend, EMAIL_FROM } from "@/lib/resend";
import BookingConfirmationEmail from "@/../emails/booking-confirmation";
import SubscriptionLowCreditsEmail from "@/../emails/subscription-low-credits";
import { z } from "zod";

const createBookingSchema = z.object({
  courseSlotId: z.string(),
  paymentMethod: z.enum(["STRIPE", "CARNET", "SUBSCRIPTION", "GIFT_VOUCHER", "CREDIT"]),
  participants: z.array(z.object({
    firstName: z.string().min(1, "Prénom requis"),
    lastName: z.string().min(1, "Nom requis"),
    email: z.string().email().optional().or(z.literal("")),
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
    return NextResponse.json({ error: "Données de réservation invalides. Vérifiez les champs participant(s)." }, { status: 400 });
  }

  const { courseSlotId, paymentMethod, participants, carnetId, subscriptionId, giftVoucherId, notes } = parsed.data;

  // Pré-validation hors transaction : vérifications légères qui ne nécessitent pas d'atomicité
  const slotCheck = await prisma.courseSlot.findUnique({
    where: { id: courseSlotId },
    include: { serviceType: true },
  });

  if (!slotCheck || !slotCheck.isActive || slotCheck.isCancelled) {
    return NextResponse.json({ error: "Créneau non disponible" }, { status: 400 });
  }
  if (slotCheck.startTime <= new Date()) {
    return NextResponse.json({ error: "Ce créneau est déjà passé" }, { status: 400 });
  }
  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
  if (slotCheck.startTime > twoMonthsFromNow) {
    return NextResponse.json({ error: "Ce créneau n'est pas encore ouvert à la réservation" }, { status: 400 });
  }

  const serviceType = slotCheck.serviceType;
  const unitPrice = Number(serviceType.price);
  const isFixed = serviceType.pricingType === "FIXED";
  const participantCount = participants.length;
  const fullPrice = isFixed ? unitPrice : unitPrice * participantCount;

  // Vérification abonnement uniquement pour cours collectifs, 1 participant max
  if (paymentMethod === "SUBSCRIPTION" && serviceType.type !== "COLLECTIVE_POTTERY") {
    return NextResponse.json({ error: "Les abonnements sont réservés aux cours collectifs uniquement" }, { status: 400 });
  }
  if (paymentMethod === "SUBSCRIPTION" && participantCount > 1) {
    return NextResponse.json({ error: "Les abonnements ne couvrent qu'une seule place par cours" }, { status: 400 });
  }

  // Vérification carnet autorisé sur ce service
  if (paymentMethod === "CARNET" && !serviceType.allowCarnet) {
    return NextResponse.json({ error: "Les carnets ne sont pas acceptés pour ce type de cours" }, { status: 400 });
  }

  // Vérification pas de double réservation sur le même créneau
  const existingBooking = await prisma.booking.findFirst({
    where: {
      userId: session.user.id,
      courseSlotId,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
  });
  if (existingBooking) {
    return NextResponse.json({ error: "Vous avez déjà une réservation sur ce créneau" }, { status: 409 });
  }

  // ─── Transaction atomique : vérif places + débits + création booking ────────
  let booking: Awaited<ReturnType<typeof prisma.booking.create>>;
  let totalAmount = 0;
  let lowCreditsSubId: string | null = null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch du slot avec lock implicite dans la transaction
      const slot = await tx.courseSlot.findUnique({
        where: { id: courseSlotId },
        include: {
          bookings: {
            where: {
              OR: [
                { status: { notIn: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ADMIN", "PENDING"] } },
                { status: "PENDING", createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
              ],
            },
            include: { participants: { select: { id: true } } },
          },
        },
      });

      if (!slot) throw new Error("SLOT_UNAVAILABLE");

      // Vérification anti-doublon à l'intérieur de la transaction (protection race condition)
      const duplicate = await tx.booking.findFirst({
        where: { userId: session.user.id, courseSlotId, status: { in: ["CONFIRMED", "PENDING"] } },
      });
      if (duplicate) throw new Error("ALREADY_BOOKED");

      // Compter les vrais participants réservés (pas le nombre de bookings)
      const bookedCount = slot.bookings.reduce((acc, b) => acc + b.participants.length, 0);
      if (bookedCount + participantCount > slot.maxParticipants) {
        throw new Error("NO_SPOTS");
      }

      // ── Débit selon mode de paiement ──────────────────────────────────────
      let txAmount = 0;

      if (paymentMethod === "CARNET") {
        if (!carnetId) throw new Error("CARNET_REQUIRED");
        const carnet = await tx.carnet.findFirst({
          where: { id: carnetId, userId: session.user.id, isActive: true },
        });
        const creditsNeeded = isFixed ? 1 : participantCount;
        if (!carnet) throw new Error("CARNET_NOT_FOUND");
        if (carnet.expiresAt < new Date()) throw new Error("CARNET_EXPIRED");
        if (carnet.usedCredits + creditsNeeded > carnet.totalCredits) throw new Error("CARNET_INSUFFICIENT");
        await tx.carnet.update({
          where: { id: carnetId },
          data: { usedCredits: { increment: creditsNeeded } },
        });

      } else if (paymentMethod === "SUBSCRIPTION") {
        if (!subscriptionId) throw new Error("SUBSCRIPTION_REQUIRED");
        const sub = await tx.subscription.findFirst({
          where: { id: subscriptionId, userId: session.user.id, status: "ACTIVE", endDate: { gte: new Date() } },
        });
        if (!sub) throw new Error("SUBSCRIPTION_INVALID");
        if (sub.remainingCredits < 1) throw new Error("SUBSCRIPTION_NO_CREDITS");
        const updated = await tx.subscription.update({
          where: { id: subscriptionId },
          data: { remainingCredits: { decrement: 1 } },
        });
        if (updated.remainingCredits === 1) lowCreditsSubId = subscriptionId;
        txAmount = isFixed ? 0 : unitPrice * (participantCount - 1);

      } else if (paymentMethod === "CREDIT") {
        const userCredits = await tx.credit.findMany({
          where: { userId: session.user.id, usedAt: null },
          orderBy: { createdAt: "asc" },
        });
        const totalCredits = userCredits.reduce((sum, c) => sum + Number(c.amount), 0);
        if (totalCredits < fullPrice) throw new Error(`CREDIT_INSUFFICIENT:${totalCredits.toFixed(2)}`);
        let remaining = fullPrice;
        for (const credit of userCredits) {
          if (remaining <= 0) break;
          const creditAmount = Number(credit.amount);
          if (creditAmount > remaining) {
            // Consommation partielle : marquer l'ancien crédit utilisé et créer le reliquat
            await tx.credit.update({ where: { id: credit.id }, data: { usedAt: new Date() } });
            await tx.credit.create({
              data: {
                userId: session.user.id,
                amount: creditAmount - remaining,
                reason: "credit_partial_remainder",
              },
            });
            remaining = 0;
          } else {
            await tx.credit.update({ where: { id: credit.id }, data: { usedAt: new Date() } });
            remaining -= creditAmount;
          }
        }

      } else if (paymentMethod === "GIFT_VOUCHER") {
        if (!giftVoucherId) throw new Error("VOUCHER_REQUIRED");
        const voucher = await tx.giftVoucher.findFirst({
          where: {
            id: giftVoucherId,
            status: "ACTIVE",
            OR: [{ ownerId: null }, { ownerId: session.user.id }],
          },
        });
        if (!voucher) throw new Error("VOUCHER_INVALID");
        if (voucher.expiresAt && voucher.expiresAt < new Date()) throw new Error("VOUCHER_EXPIRED");
        txAmount = Math.max(0, fullPrice - Number(voucher.amountValue ?? 0));

      } else if (paymentMethod === "STRIPE") {
        txAmount = fullPrice;
      }

      totalAmount = txAmount;

      // ── Création du booking ───────────────────────────────────────────────
      const newBooking = await tx.booking.create({
        data: {
          userId: session.user.id,
          courseSlotId,
          status: totalAmount > 0 ? "PENDING" : "CONFIRMED",
          paymentMethod,
          paymentStatus: totalAmount > 0 ? "PENDING" : "PAID",
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

      // Bon cadeau gratuit (0€) → marquer utilisé dans la transaction
      if (paymentMethod === "GIFT_VOUCHER" && giftVoucherId && totalAmount === 0) {
        await tx.giftVoucher.update({
          where: { id: giftVoucherId },
          data: { status: "REDEEMED", redeemedAt: new Date() },
        });
      }

      return newBooking;
    });

    booking = result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NO_SPOTS") return NextResponse.json({ error: "Plus assez de places disponibles", canWaitlist: true }, { status: 409 });
    if (msg === "ALREADY_BOOKED") return NextResponse.json({ error: "Vous avez déjà une réservation sur ce créneau" }, { status: 409 });
    if (msg === "SLOT_UNAVAILABLE") return NextResponse.json({ error: "Créneau non disponible" }, { status: 400 });
    if (msg === "CARNET_REQUIRED") return NextResponse.json({ error: "Carnet requis" }, { status: 400 });
    if (msg === "CARNET_NOT_FOUND") return NextResponse.json({ error: "Carnet introuvable" }, { status: 400 });
    if (msg === "CARNET_EXPIRED") return NextResponse.json({ error: "Ce carnet est expiré" }, { status: 400 });
    if (msg === "CARNET_INSUFFICIENT") return NextResponse.json({ error: "Carnet insuffisant" }, { status: 400 });
    if (msg === "SUBSCRIPTION_REQUIRED") return NextResponse.json({ error: "Abonnement requis" }, { status: 400 });
    if (msg === "SUBSCRIPTION_INVALID") return NextResponse.json({ error: "Abonnement inactif ou expiré" }, { status: 400 });
    if (msg === "SUBSCRIPTION_NO_CREDITS") return NextResponse.json({ error: "Plus de crédits sur cet abonnement" }, { status: 400 });
    if (msg.startsWith("CREDIT_INSUFFICIENT:")) {
      const avail = msg.split(":")[1];
      return NextResponse.json({ error: `Crédits insuffisants (disponible : ${avail} €)` }, { status: 400 });
    }
    if (msg === "VOUCHER_REQUIRED") return NextResponse.json({ error: "Bon cadeau requis" }, { status: 400 });
    if (msg === "VOUCHER_INVALID") return NextResponse.json({ error: "Bon cadeau invalide ou déjà utilisé" }, { status: 400 });
    if (msg === "VOUCHER_EXPIRED") return NextResponse.json({ error: "Ce bon cadeau est expiré" }, { status: 400 });
    console.error("[bookings] Transaction échouée:", err);
    return NextResponse.json({ error: "Erreur lors de la réservation" }, { status: 500 });
  }

  // ─── Hors transaction : appels externes ────────────────────────────────────

  // Email alerte crédits faibles abonnement
  if (lowCreditsSubId) {
    const subData = await prisma.subscription.findUnique({
      where: { id: lowCreditsSubId },
      include: { plan: true, user: true },
    });
    if (subData) {
      resend.emails.send({
        from: EMAIL_FROM,
        to: subData.user.email,
        subject: `Plus qu'un cours restant sur votre abonnement ${subData.plan.name}`,
        react: SubscriptionLowCreditsEmail({
          clientName: subData.user.firstName ?? subData.user.name ?? "Client",
          planName: subData.plan.name,
          remainingCredits: 1,
          endDate: subData.endDate.toLocaleDateString("fr-FR"),
          appUrl: process.env.NEXT_PUBLIC_APP_URL!,
        }),
      }).catch((e) => console.error("[booking] Low credits email échoué:", e));
    }
  }

  // Paiement Stripe nécessaire
  if (totalAmount > 0) {
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: serviceType.name,
            description: `${participantCount} participant(s) — ${new Date(slotCheck.startTime).toLocaleDateString("fr-FR")}`,
          },
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/mon-espace/reservations?success=true&bookingId=${booking.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/reserver?cancelled=true`,
      metadata: { bookingId: booking.id, giftVoucherId: giftVoucherId ?? "" },
    });
    await prisma.booking.update({ where: { id: booking.id }, data: { stripeSessionId: stripeSession.id } });
    return NextResponse.json({ checkoutUrl: stripeSession.url, bookingId: booking.id });
  }

  // Réservation confirmée → email
  const fullBooking = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: { user: true, slot: { include: { serviceType: true } }, participants: true },
  });
  if (fullBooking) {
    const slotDate = new Date(fullBooking.slot.startTime);
    const payLabel = paymentMethod === "GIFT_VOUCHER" ? "Bon cadeau" : paymentMethod === "CARNET" ? "Carnet" : paymentMethod === "CREDIT" ? "Avoir" : "Abonnement";
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
        paymentMethod: payLabel,
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
    include: { slot: { include: { serviceType: true } }, participants: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}
