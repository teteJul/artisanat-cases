import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { CarnetPlansAdmin } from "@/components/admin/carnet-plans-admin";
import { CarnetsListAdmin } from "@/components/admin/carnets-list-admin";

export const metadata: Metadata = { title: "Carnets de cours" };

export default async function AdminCarnetsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "clients" ? "clients" : "plans";

  const [plans, serviceTypes, carnets] = await Promise.all([
    prisma.carnetPlan.findMany({
      include: { serviceType: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.serviceType.findMany({
      where: { isActive: true, allowCarnet: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.carnet.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, name: true, email: true } },
        serviceType: { select: { id: true, name: true } },
      },
      orderBy: { purchasedAt: "desc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Carnets de cours</h1>
        <p className="text-muted-foreground mt-1">Gérez les offres de carnets et les carnets achetés par les clients.</p>
      </div>

      <div className="flex gap-1 mb-6 bg-secondary/50 p-1 rounded-lg w-fit">
        <a
          href="/admin/carnets?tab=plans"
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === "plans" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Plans carnet
        </a>
        <a
          href="/admin/carnets?tab=clients"
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === "clients" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Carnets clients
          {carnets.length > 0 && (
            <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{carnets.length}</span>
          )}
        </a>
      </div>

      {activeTab === "plans" && (
        <CarnetPlansAdmin
          initialPlans={plans.map((p) => ({ ...p, price: Number(p.price) }))}
          serviceTypes={serviceTypes}
        />
      )}

      {activeTab === "clients" && (
        <CarnetsListAdmin
          initialCarnets={carnets.map((c) => ({
            ...c,
            purchasedAt: c.purchasedAt.toISOString(),
            expiresAt: c.expiresAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
