import { Metadata } from "next";
import { BookingCalendar } from "@/components/booking/booking-calendar";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Réserver un cours",
  description: "Réservez votre cours de poterie ou atelier céramique en ligne.",
};

export default async function ReserverPage() {
  const [rawServices, cancellationSetting] = await Promise.all([
    prisma.serviceType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.appSetting.findUnique({ where: { key: "cancellation_deadline_hours" } }),
  ]);

  const serviceTypes = rawServices.map((s) => ({
    ...s,
    price: Number(s.price),
  }));

  const cancellationDeadlineHours = parseInt(cancellationSetting?.value ?? "48");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Réserver un cours</h1>
        <p className="text-muted-foreground">
          Sélectionnez un service puis choisissez votre créneau. Le planning est ouvert 2 mois à
          l'avance.
        </p>
      </div>
      <BookingCalendar serviceTypes={serviceTypes} cancellationDeadlineHours={cancellationDeadlineHours} />
    </div>
  );
}
