import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CoursAdmin } from "@/components/admin/cours/cours-admin";

export const metadata: Metadata = { title: "Admin — Cours & créneaux" };

export default async function AdminCoursPage() {
  const services = await prisma.serviceType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const holidays = await prisma.schoolHoliday.findMany({
    orderBy: { startDate: "asc" },
  });

  const serialized = services.map((s) => ({ ...s, price: Number(s.price) }));
  const serializedHolidays = holidays.map((h) => ({
    ...h,
    startDate: h.startDate.toISOString(),
    endDate: h.endDate.toISOString(),
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Cours & créneaux</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les créneaux de cours, créez des récurrences et annulez des séances.
        </p>
      </div>
      <CoursAdmin services={serialized} holidays={serializedHolidays} />
    </div>
  );
}
