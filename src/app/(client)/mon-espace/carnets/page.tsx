import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { formatDate, formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Mes carnets" };

export default async function MesCarnetPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [carnets, subscriptions, credits] = await Promise.all([
    prisma.carnet.findMany({
      where: { userId: session.user.id },
      include: { serviceType: true },
      orderBy: [{ isActive: "desc" }, { expiresAt: "asc" }],
    }),
    prisma.subscription.findMany({
      where: { userId: session.user.id },
      include: { plan: true },
      orderBy: [{ status: "asc" }, { endDate: "desc" }],
    }),
    prisma.credit.findMany({
      where: { userId: session.user.id, usedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalCredit = credits.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Mes carnets & abonnements</h1>
        <p className="text-muted-foreground mt-1">Suivez vos crédits de cours et abonnements.</p>
      </div>

      {/* Avoir en compte */}
      {totalCredit > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Avoir disponible</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Utilisable automatiquement lors de votre prochaine réservation
            </p>
          </div>
          <p className="font-heading text-2xl font-bold text-primary">{formatPrice(totalCredit)}</p>
        </div>
      )}

      {/* Carnets */}
      <section className="mb-8">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Carnets de cours
        </h2>

        {carnets.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground mb-4">Vous n'avez pas encore de carnet.</p>
            <Link href="/tarifs#carnet" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              Voir les carnets disponibles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {carnets.map((carnet) => {
              const remaining = carnet.totalCredits - carnet.usedCredits;
              const pct = Math.round((remaining / carnet.totalCredits) * 100);
              const isExpired = !carnet.isActive || new Date(carnet.expiresAt) < new Date();
              const expiresSoon = !isExpired && new Date(carnet.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              return (
                <div
                  key={carnet.id}
                  className={`bg-card border rounded-xl p-5 ${
                    isExpired ? "opacity-60 border-border" :
                    expiresSoon ? "border-amber-300" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{carnet.serviceType.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Acheté le {formatDate(carnet.purchasedAt)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isExpired ? "bg-secondary text-muted-foreground" :
                      expiresSoon ? "bg-amber-100 text-amber-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {isExpired ? "Expiré" : expiresSoon ? "Expire bientôt" : "Actif"}
                    </span>
                  </div>

                  {/* Barre de progression */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-foreground">{remaining} cours restants</span>
                      <span className="text-muted-foreground">{carnet.totalCredits} total</span>
                    </div>
                    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct > 50 ? "bg-primary" : pct > 20 ? "bg-amber-400" : "bg-red-400"
                        }`}
                        style={{ width: `${Math.max(pct, 0)}%` }}
                      />
                    </div>
                  </div>

                  <p className={`text-xs ${expiresSoon ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                    {isExpired ? `Expiré le ${formatDate(carnet.expiresAt)}` : `Valable jusqu'au ${formatDate(carnet.expiresAt)}`}
                  </p>

                  {!isExpired && remaining > 0 && (
                    <Link
                      href="/reserver"
                      className="mt-3 block text-center text-sm text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-primary/5 transition-colors"
                    >
                      Utiliser un crédit
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Abonnements */}
      <section className="mb-8">
        <h2 className="font-semibold text-foreground mb-4">Engagements annuels</h2>

        {subscriptions.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground mb-4">Vous n'avez pas d'engagement annuel.</p>
            <Link href="/tarifs#engagement" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              Découvrir les formules <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const pct = Math.round((sub.remainingCredits / sub.plan.totalCourses) * 100);
              const isActive = sub.status === "ACTIVE";
              return (
                <div key={sub.id} className={`bg-card border rounded-xl p-5 ${!isActive ? "opacity-60" : "border-border"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{sub.plan.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Du {formatDate(sub.startDate)} au {formatDate(sub.endDate)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"
                    }`}>
                      {sub.status === "ACTIVE" ? "Actif" : sub.status === "EXPIRED" ? "Expiré" : "Annulé"}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-foreground">{sub.remainingCredits} cours restants</span>
                      <span className="text-muted-foreground">{sub.plan.totalCourses} total · {formatPrice(Number(sub.plan.price))}</span>
                    </div>
                    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.max(pct, 0)}%` }}
                      />
                    </div>
                  </div>

                  {isActive && sub.remainingCredits > 0 && (
                    <Link
                      href="/reserver"
                      className="mt-2 block text-center text-sm text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-primary/5 transition-colors"
                    >
                      Réserver avec mon abonnement
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Historique des avoirs */}
      {credits.length > 0 && (
        <section>
          <h2 className="font-semibold text-foreground mb-4">Avoirs disponibles</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Raison</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {credits.map((credit) => (
                  <tr key={credit.id}>
                    <td className="px-4 py-3 text-foreground">
                      {credit.reason === "cancellation_refund" ? "Remboursement annulation" :
                       credit.reason === "admin_slot_cancellation" ? "Cours annulé par l'atelier" :
                       credit.reason}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {formatDate(credit.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {formatPrice(Number(credit.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
