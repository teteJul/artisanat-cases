import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import { Users, CalendarDays, BookOpen, TrendingUp, AlertTriangle } from "lucide-react";

export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboardPage() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    totalClients,
    activeSubscriptions,
    activeCarnets,
    bookingsThisMonth,
    upcomingSlots,
    waitlistCount,
    expiringCarnets,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.carnet.count({ where: { isActive: true } }),
    prisma.booking.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { amountPaid: true },
    }),
    prisma.courseSlot.findMany({
      where: { startTime: { gte: now }, isCancelled: false },
      include: {
        serviceType: true,
        bookings: { where: { status: { notIn: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ADMIN"] } } },
      },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
    prisma.waitlist.count(),
    prisma.carnet.count({
      where: {
        isActive: true,
        expiresAt: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const revenueThisMonth = bookingsThisMonth.reduce(
    (sum, b) => sum + Number(b.amountPaid ?? 0),
    0
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "CA ce mois", value: formatPrice(revenueThisMonth), icon: TrendingUp, color: "text-green-600" },
          { label: "Clients total", value: totalClients.toString(), icon: Users, color: "text-blue-600" },
          { label: "Abonnements actifs", value: activeSubscriptions.toString(), icon: BookOpen, color: "text-purple-600" },
          { label: "Carnets actifs", value: activeCarnets.toString(), icon: CalendarDays, color: "text-orange-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prochains créneaux */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Prochains créneaux</h2>
            <Link href="/admin/cours" className="text-sm text-primary hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {upcomingSlots.map((slot) => {
              const fillRate = Math.round((slot.bookings.length / slot.maxParticipants) * 100);
              return (
                <div key={slot.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{slot.serviceType.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(slot.startTime).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}
                      {new Date(slot.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {slot.bookings.length}/{slot.maxParticipants}
                    </p>
                    <div className="w-16 h-1.5 bg-secondary rounded-full mt-1">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${fillRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {upcomingSlots.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun créneau à venir</p>
            )}
          </div>
        </div>

        {/* Alertes */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Alertes</h2>
          <div className="space-y-3">
            {waitlistCount > 0 && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {waitlistCount} personne{waitlistCount > 1 ? "s" : ""} en liste d'attente
                  </p>
                  <Link href="/admin/reservations?tab=waitlist" className="text-xs text-amber-600 hover:underline">
                    Voir les listes d'attente
                  </Link>
                </div>
              </div>
            )}
            {expiringCarnets > 0 && (
              <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    {expiringCarnets} carnet{expiringCarnets > 1 ? "s" : ""} expirent dans 30 jours
                  </p>
                  <Link href="/admin/clients" className="text-xs text-orange-600 hover:underline">
                    Voir les clients concernés
                  </Link>
                </div>
              </div>
            )}
            {waitlistCount === 0 && expiringCarnets === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">✅ Aucune alerte en cours</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/admin/cours" className="text-center bg-primary text-primary-foreground text-xs px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                + Nouveau créneau
              </Link>
              <Link href="/admin/bons-cadeaux" className="text-center border border-border text-foreground text-xs px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                + Bon cadeau
              </Link>
              <Link href="/admin/reporting" className="text-center border border-border text-foreground text-xs px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                Voir le reporting
              </Link>
              <Link href="/admin/parametres" className="text-center border border-border text-foreground text-xs px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                Paramètres
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
