import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import BookingReminderEmail from "@/../emails/booking-reminder";

// Cette route est appelée via un cron job (configurer sur Hostinger ou via un service externe)
// Ex: curl https://artisanatcases.fr/api/cron/reminders?secret=XXX chaque jour à 8h

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const start = new Date(tomorrow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(tomorrow);
  end.setHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      slot: { startTime: { gte: start, lte: end } },
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
          date: slotDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
          time: slotDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          appUrl: process.env.NEXT_PUBLIC_APP_URL!,
        }),
      });
      sent++;
    } catch {
      // On continue même si un email échoue
    }
  }

  return NextResponse.json({ sent, total: bookings.length });
}
