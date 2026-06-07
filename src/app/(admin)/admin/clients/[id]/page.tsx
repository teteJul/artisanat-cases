import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, Calendar, BookOpen, CreditCard, Gift } from "lucide-react";

export const metadata: Metadata = { title: "Admin — Fiche client" };

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [user, bookings, carnets, subscriptions, credits, vouchers] = await Promise.all([
    prisma.user.findUnique({
      where: { id, role: "CLIENT" },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { userId: id },
      include: { slot: { include: { serviceType: true } }, participants: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.carnet.findMany({
      where: { userId: id },
      include: { serviceType: true },
      orderBy: { purchasedAt: "desc" },
    }),
    prisma.subscription.findMany({
      where: { userId: id },
      include: { plan: true },
    }),
    prisma.credit.findMany({
      where: { userId: id, usedAt: null },
    }),
    prisma.giftVoucher.findMany({
      where: { ownerId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) notFound();

  const totalCredit = credits.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalSpent = bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + Number(b.amountPaid ?? 0), 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/clients" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux clients
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2">
              <a href={`mailto:${user.email}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />{user.email}
              </a>
              {user.phone && (
                <a href={`tel:${user.phone}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-4 h-4" />{user.phone}
                </a>
              )}
              <span className="text-sm text-muted-foreground">
                Client depuis le {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Cours réservés", value: bookings.filter((b) => b.status === "CONFIRMED").length.toString(), icon: Calendar },
          { label: "CA total", value: formatPrice(totalSpent), icon: CreditCard },
          { label: "Carnets actifs", value: carnets.filter((c) => c.isActive).length.toString(), icon: BookOpen },
          { label: "Avoir disponible", value: formatPrice(totalCredit), icon: Gift },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
            <p className="text-xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Réservations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Historique des réservations</h2>
            </div>
            {bookings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Aucune réservation</p>
            ) : (
              <div className="divide-y divide-border">
                {bookings.map((b) => (
                  <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.slot.serviceType.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(b.slot.startTime, "d MMM yyyy")} · {formatTime(b.slot.startTime)}
                        {b.participants.length > 1 && ` · ${b.participants.length} pers.`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {Number(b.amountPaid ?? 0) > 0 && (
                        <span className="text-sm font-medium text-primary">{formatPrice(Number(b.amountPaid))}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                        b.status.includes("CANCELLED") ? "bg-red-100 text-red-600" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {b.status === "CONFIRMED" ? "Confirmé" :
                         b.status === "CANCELLED_BY_CLIENT" ? "Annulé" :
                         b.status === "CANCELLED_BY_ADMIN" ? "Annulé admin" :
                         b.status === "COMPLETED" ? "Terminé" : b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar droite */}
        <div className="space-y-4">
          {/* Carnets */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Carnets</h2>
            </div>
            {carnets.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">Aucun carnet</p>
            ) : (
              <div className="divide-y divide-border">
                {carnets.map((c) => {
                  const remaining = c.totalCredits - c.usedCredits;
                  const pct = Math.round((remaining / c.totalCredits) * 100);
                  return (
                    <div key={c.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-foreground">{c.serviceType.name}</p>
                      <div className="mt-1.5 mb-1">
                        <div className="w-full h-1.5 bg-secondary rounded-full">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {remaining}/{c.totalCredits} · {c.isActive ? `exp. ${formatDate(c.expiresAt, "d MMM yy")}` : "Expiré"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Abonnements */}
          {subscriptions.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Abonnements</h2>
              </div>
              <div className="divide-y divide-border">
                {subscriptions.map((s) => (
                  <div key={s.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-foreground">{s.plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.remainingCredits}/{s.plan.totalCourses} cours ·{" "}
                      <span className={s.status === "ACTIVE" ? "text-green-600" : "text-muted-foreground"}>
                        {s.status === "ACTIVE" ? "Actif" : "Expiré"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bons cadeaux */}
          {vouchers.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Bons cadeaux</h2>
              </div>
              <div className="divide-y divide-border">
                {vouchers.map((v) => (
                  <div key={v.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-bold text-foreground">{v.code}</p>
                      <p className="text-xs text-muted-foreground">{v.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      v.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"
                    }`}>
                      {v.status === "ACTIVE" ? "Actif" : v.status === "REDEEMED" ? "Utilisé" : "Expiré"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avoirs */}
          {totalCredit > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <p className="text-sm font-medium text-foreground">Avoir disponible</p>
              <p className="text-2xl font-bold text-primary mt-1">{formatPrice(totalCredit)}</p>
              <p className="text-xs text-muted-foreground mt-1">Utilisable lors d'une réservation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
