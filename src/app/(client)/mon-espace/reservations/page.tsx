import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { resend, EMAIL_FROM } from "@/lib/resend";
import BookingConfirmationEmail from "@/../emails/booking-confirmation";
import { Metadata } from "next";
import { MesReservations } from "@/components/booking/mes-reservations";

export const metadata: Metadata = { title: "Mes réservations" };

export default async function MesReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; bookingId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const params = await searchParams;
  const now = new Date();

  // Si retour de Stripe avec succès, confirmer la réservation directement
  if (params.success === "true" && params.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      select: {
        id: true, status: true, stripeSessionId: true, giftVoucherId: true,
        amountPaid: true,
        user: { select: { email: true, firstName: true, name: true } },
        slot: { include: { serviceType: true } },
        participants: true,
      },
    });

    if (booking && booking.status === "PENDING" && booking.stripeSessionId) {
      try {
        const stripeSession = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
        if (stripeSession.payment_status === "paid") {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: "CONFIRMED",
              paymentStatus: "PAID",
              stripePaymentId: stripeSession.payment_intent as string,
            },
          });

          // Marquer le bon cadeau comme utilisé si présent
          if (booking.giftVoucherId) {
            await prisma.giftVoucher.update({
              where: { id: booking.giftVoucherId },
              data: { status: "REDEEMED", redeemedAt: new Date() },
            }).catch(() => {});
          }

          // Envoyer email de confirmation
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
          }).catch((e) => console.error("[reservations] Email échoué:", e));
        }
      } catch (e) {
        console.error("[reservations] Vérification Stripe échouée:", e);
      }
    }
  }

  const cancellationSetting = await prisma.appSetting.findUnique({
    where: { key: "cancellation_deadline_hours" },
  });
  const cancellationDeadlineHours = parseInt(cancellationSetting?.value ?? "48");

  const [upcoming, past] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["CONFIRMED", "PENDING"] },
        slot: { startTime: { gte: now } },
      },
      include: {
        slot: { include: { serviceType: true } },
        participants: true,
      },
      orderBy: { slot: { startTime: "asc" } },
    }),
    prisma.booking.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { slot: { startTime: { lt: now } } },
          { status: { in: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ADMIN", "COMPLETED", "NO_SHOW"] } },
        ],
      },
      include: {
        slot: { include: { serviceType: true } },
        participants: true,
      },
      orderBy: { slot: { startTime: "desc" } },
      take: 20,
    }),
  ]);

  const serialize = (bookings: typeof upcoming) =>
    bookings.map((b) => ({
      ...b,
      amountPaid: b.amountPaid ? Number(b.amountPaid) : null,
      slot: {
        ...b.slot,
        startTime: b.slot.startTime.toISOString(),
        endTime: b.slot.endTime.toISOString(),
        serviceType: { ...b.slot.serviceType, price: Number(b.slot.serviceType.price) },
      },
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      cancelledAt: b.cancelledAt?.toISOString() ?? null,
    }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Mes réservations</h1>
        <p className="text-muted-foreground mt-1">Gérez vos cours à venir et consultez votre historique.</p>
      </div>

      {params.success === "true" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-green-600 text-xl">✅</span>
          <div>
            <p className="font-medium text-green-800">Réservation confirmée !</p>
            <p className="text-sm text-green-600">Vous recevrez un email de confirmation dans quelques instants.</p>
          </div>
        </div>
      )}

      <MesReservations upcoming={serialize(upcoming)} past={serialize(past)} cancellationDeadlineHours={cancellationDeadlineHours} />
    </div>
  );
}
