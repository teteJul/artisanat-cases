import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import BookingReminderEmail from "@/../emails/booking-reminder";
import { parisOffsetMinutes } from "@/lib/subscriptions";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Fenêtre "demain" en heure de Paris (UTC+1 hiver / UTC+2 été)
  // parisOffsetMinutes() utilise les règles DST européennes, indépendant du fuseau du serveur
  const now = new Date();
  const parisOffset = parisOffsetMinutes(now);
  const parisNow = new Date(now.getTime() + parisOffset * 60 * 1000);

  const tomorrowParis = new Date(parisNow);
  tomorrowParis.setUTCDate(tomorrowParis.getUTCDate() + 1);

  const y = tomorrowParis.getUTCFullYear();
  const m = tomorrowParis.getUTCMonth();
  const d = tomorrowParis.getUTCDate();

  // Bornes en UTC correspondant à 00:00–23:59 heure de Paris demain
  const startUTC = new Date(Date.UTC(y, m, d, 0, 0, 0) - parisOffset * 60 * 1000);
  const endUTC = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - parisOffset * 60 * 1000);

  // Seulement les bookings CONFIRMED sans reminder déjà envoyé
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      slot: { startTime: { gte: startUTC, lte: endUTC } },
    },
    include: {
      user: true,
      slot: { include: { serviceType: true } },
    },
  });

  let sent = 0;
  for (const booking of bookings) {
    const slotDate = new Date(booking.slot.startTime);
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: booking.user.email,
        subject: `Rappel — Votre cours demain : ${booking.slot.serviceType.name}`,
        react: BookingReminderEmail({
          clientName: booking.user.firstName ?? booking.user.name ?? "Client",
          serviceName: booking.slot.serviceType.name,
          date: slotDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }),
          time: slotDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }),
          appUrl: process.env.NEXT_PUBLIC_APP_URL!,
        }),
      });
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    } catch (e) {
      console.error(`[cron/reminders] Email échoué pour booking ${booking.id}:`, e);
    }
  }

  return NextResponse.json({ sent, total: bookings.length });
}
