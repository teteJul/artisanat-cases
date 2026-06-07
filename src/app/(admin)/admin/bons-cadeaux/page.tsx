import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BonsCadeauxAdmin } from "@/components/admin/bons-cadeaux-admin";

export const metadata: Metadata = { title: "Admin — Bons cadeaux" };

export default async function AdminBonsCadeauxPage() {
  const [vouchers, services] = await Promise.all([
    prisma.giftVoucher.findMany({
      include: { owner: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.serviceType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const serialized = vouchers.map((v) => ({
    ...v,
    amountValue: v.amountValue ? Number(v.amountValue) : null,
    createdAt: v.createdAt.toISOString(),
    purchasedAt: v.purchasedAt.toISOString(),
    expiresAt: v.expiresAt?.toISOString() ?? null,
    redeemedAt: v.redeemedAt?.toISOString() ?? null,
  }));

  const serializedServices = services.map((s) => ({ ...s, price: Number(s.price) }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Bons cadeaux</h1>
        <p className="text-muted-foreground mt-1">Gérez les bons cadeaux vendus et créez-en manuellement.</p>
      </div>
      <BonsCadeauxAdmin initialVouchers={serialized} services={serializedServices} />
    </div>
  );
}
