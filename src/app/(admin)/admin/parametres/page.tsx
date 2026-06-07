import { Metadata } from "next";
import { ParametresAdmin } from "@/components/admin/parametres-admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin — Paramètres" };

export default async function ParametresPage() {
  const [settings, services, plans] = await Promise.all([
    prisma.appSetting.findMany(),
    prisma.serviceType.findMany({ orderBy: { name: "asc" } }),
    prisma.subscriptionPlan.findMany({ orderBy: { price: "asc" } }),
  ]);

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const serializedServices = services.map((s) => ({ ...s, price: Number(s.price) }));
  const serializedPlans = plans.map((p) => ({ ...p, price: Number(p.price) }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Gérez les services, tarifs et paramètres de l'application.</p>
      </div>
      <ParametresAdmin settings={settingsMap} services={serializedServices} plans={serializedPlans} />
    </div>
  );
}
