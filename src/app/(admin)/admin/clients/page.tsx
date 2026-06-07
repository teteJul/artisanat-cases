import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ClientsAdmin } from "@/components/admin/clients-admin";

export const metadata: Metadata = { title: "Admin — Clients" };

export default async function AdminClientsPage() {
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: {
        select: {
          bookings: { where: { status: "CONFIRMED" } },
          carnets: { where: { isActive: true } },
          subscriptions: { where: { status: "ACTIVE" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = clients.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Clients</h1>
        <p className="text-muted-foreground mt-1">
          {clients.length} client{clients.length > 1 ? "s" : ""} inscrits
        </p>
      </div>
      <ClientsAdmin initialClients={serialized} />
    </div>
  );
}
