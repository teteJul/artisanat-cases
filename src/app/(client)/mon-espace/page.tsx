import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate, formatTime, formatPrice, canCancelBooking } from "@/lib/utils";
import { BookOpen, Gift, CreditCard, User, Calendar } from "lucide-react";

export const metadata = { title: "Mon espace" };

export default async function MonEspacePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [upcomingBookings, activeCarnets, activeSubscriptions, vouchers, credits] =
    await Promise.all([
      prisma.booking.findMany({
        where: {
          userId: session.user.id,
          status: "CONFIRMED",
          slot: { startTime: { gte: new Date() } },
        },
        include: { slot: { include: { serviceType: true } }, participants: true },
        orderBy: { slot: { startTime: "asc" } },
        take: 3,
      }),
      prisma.carnet.findMany({
        where: { userId: session.user.id, isActive: true },
        include: { serviceType: true },
        orderBy: { expiresAt: "asc" },
      }),
      prisma.subscription.findMany({
        where: { userId: session.user.id, status: "ACTIVE" },
        include: { plan: true },
      }),
      prisma.giftVoucher.findMany({
        where: { ownerId: session.user.id, status: "ACTIVE" },
      }),
      prisma.credit.findMany({
        where: { userId: session.user.id, usedAt: null },
      }),
    ]);

  const totalCredit = credits.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Bonjour {session.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Bienvenue dans votre espace personnel.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Cours à venir", value: upcomingBookings.length.toString(), icon: Calendar, href: "/mon-espace/reservations" },
          { label: "Carnets actifs", value: activeCarnets.length.toString(), icon: BookOpen, href: "/mon-espace/carnets" },
          { label: "Bons cadeaux", value: vouchers.length.toString(), icon: Gift, href: "/mon-espace/bons-cadeaux" },
          { label: "Crédit disponible", value: formatPrice(totalCredit), icon: CreditCard, href: "/mon-espace/profil" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <stat.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Prochains cours */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Vos prochains cours</h2>
          <Link href="/mon-espace/reservations" className="text-sm text-primary hover:underline">
            Voir tout
          </Link>
        </div>
        {upcomingBookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Aucun cours à venir.</p>
            <Link href="/reserver" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Réserver un cours
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {booking.slot.serviceType.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(booking.slot.startTime)} à {formatTime(booking.slot.startTime)}
                    {booking.participants.length > 1 && ` · ${booking.participants.length} participants`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {canCancelBooking(booking.slot.startTime) && (
                    <Link
                      href={`/mon-espace/reservations/${booking.id}/annuler`}
                      className="text-xs text-destructive hover:underline"
                    >
                      Annuler
                    </Link>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                    Confirmé
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Carnets */}
      {activeCarnets.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Mes carnets</h2>
            <Link href="/mon-espace/carnets" className="text-sm text-primary hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {activeCarnets.map((carnet) => {
              const remaining = carnet.totalCredits - carnet.usedCredits;
              const pct = Math.round((remaining / carnet.totalCredits) * 100);
              return (
                <div key={carnet.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{carnet.serviceType.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {remaining}/{carnet.totalCredits} cours restants
                    </p>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expire le {formatDate(carnet.expiresAt)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation rapide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/reserver", label: "📅 Réserver un cours" },
          { href: "/mon-espace/bons-cadeaux", label: "🎁 Mes bons cadeaux" },
          { href: "/mon-espace/profil", label: "👤 Mon profil" },
          { href: "/bon-cadeau", label: "🛒 Acheter un bon cadeau" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-card border border-border rounded-lg p-4 text-center text-sm font-medium text-foreground hover:border-primary/40 hover:bg-secondary/50 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
