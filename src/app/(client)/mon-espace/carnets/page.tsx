import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { resend, EMAIL_FROM } from "@/lib/resend";
import SubscriptionConfirmationEmail from "@/../emails/subscription-confirmation";
import { computeEndDate } from "@/lib/subscriptions";
import { Metadata } from "next";
import { formatDate, formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { SubscriptionBuySection } from "@/components/subscription/subscription-buy-section";
import { SubscriptionCancelButton } from "@/components/subscription/subscription-cancel-button";
import { CarnetBuySection } from "@/components/carnet/carnet-buy-section";

export const metadata: Metadata = { title: "Mes carnets & abonnements" };


export default async function MesCarnetPage({
  searchParams,
}: {
  searchParams: Promise<{ subSuccess?: string; subscriptionId?: string; subCancelled?: string; carnetSuccess?: string; carnetCancelled?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const params = await searchParams;

  // Confirmation achat abonnement via Stripe
  if (params.subSuccess === "true" && params.subscriptionId) {
    const sub = await prisma.subscription.findUnique({
      where: { id: params.subscriptionId },
      include: { plan: true, user: true },
    });

    if (sub && sub.status === "PENDING" && sub.stripeSessionId) {
      try {
        const stripeSession = await stripe.checkout.sessions.retrieve(sub.stripeSessionId);
        if (stripeSession.payment_status === "paid") {
          const startDate = new Date();
          const endDate = computeEndDate(startDate, sub.plan.cycleType);
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: "ACTIVE",
              stripePaymentId: stripeSession.payment_intent as string,
              startDate,
              endDate,
            },
          });
          resend.emails.send({
            from: EMAIL_FROM,
            to: sub.user.email,
            subject: `Votre abonnement ${sub.plan.name} est activé`,
            react: SubscriptionConfirmationEmail({
              clientName: sub.user.firstName ?? sub.user.name ?? "Client",
              planName: sub.plan.name,
              totalCourses: sub.plan.totalCourses,
              startDate: startDate.toLocaleDateString("fr-FR"),
              endDate: endDate.toLocaleDateString("fr-FR"),
              price: `${Number(sub.plan.price).toFixed(2)} €`,
              appUrl: process.env.NEXT_PUBLIC_APP_URL!,
            }),
          }).catch((e) => console.error("[carnets] Sub email échoué:", e));
        }
      } catch (e) {
        console.error("[carnets] Stripe check échoué:", e);
      }
    }
  }

  const [carnets, subscriptions, credits, plans, carnetPlans] = await Promise.all([
    prisma.carnet.findMany({
      where: { userId: session.user.id },
      include: { serviceType: true },
      orderBy: [{ isActive: "desc" }, { expiresAt: "asc" }],
    }),
    prisma.subscription.findMany({
      where: { userId: session.user.id, status: { in: ["ACTIVE", "EXPIRED", "CANCELLED"] } },
      include: { plan: true },
      orderBy: [{ status: "asc" }, { endDate: "desc" }],
    }),
    prisma.credit.findMany({
      where: { userId: session.user.id, usedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    }),
    prisma.carnetPlan.findMany({
      where: { isActive: true },
      include: { serviceType: { select: { id: true, name: true } } },
      orderBy: { price: "asc" },
    }),
  ]);

  const totalCredit = credits.reduce((sum, c) => sum + Number(c.amount), 0);
  const hasActiveSubscription = subscriptions.some((s) => s.status === "ACTIVE");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Mes carnets & abonnements</h1>
        <p className="text-muted-foreground mt-1">Suivez vos crédits de cours et abonnements.</p>
      </div>

      {params.subSuccess === "true" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-green-600 text-xl">✅</span>
          <div>
            <p className="font-medium text-green-800">Abonnement activé !</p>
            <p className="text-sm text-green-600">Vous recevrez un email de confirmation dans quelques instants.</p>
          </div>
        </div>
      )}

      {params.carnetSuccess === "true" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-green-600 text-xl">✅</span>
          <div>
            <p className="font-medium text-green-800">Carnet activé !</p>
            <p className="text-sm text-green-600">Vous recevrez un email de confirmation. Votre carnet est disponible ci-dessous.</p>
          </div>
        </div>
      )}

      {params.carnetCancelled === "true" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">Paiement annulé — votre carnet n'a pas été activé.</p>
        </div>
      )}

      {params.subCancelled === "true" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">Paiement annulé — votre abonnement n'a pas été activé.</p>
        </div>
      )}

      {/* Avoir en compte */}
      {totalCredit > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Avoir disponible</p>
            <p className="text-sm text-muted-foreground mt-0.5">Utilisable lors de votre prochaine réservation</p>
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
                <div key={carnet.id} className={`bg-card border rounded-xl p-5 ${isExpired ? "opacity-60 border-border" : expiresSoon ? "border-amber-300" : "border-border"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{carnet.serviceType.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Acheté le {formatDate(carnet.purchasedAt)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpired ? "bg-secondary text-muted-foreground" : expiresSoon ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {isExpired ? "Expiré" : expiresSoon ? "Expire bientôt" : "Actif"}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-foreground">{remaining} cours restants</span>
                      <span className="text-muted-foreground">{carnet.totalCredits} total</span>
                    </div>
                    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct > 50 ? "bg-primary" : pct > 20 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${Math.max(pct, 0)}%` }} />
                    </div>
                  </div>
                  <p className={`text-xs ${expiresSoon ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                    {isExpired ? `Expiré le ${formatDate(carnet.expiresAt)}` : `Valable jusqu'au ${formatDate(carnet.expiresAt)}`}
                  </p>
                  {!isExpired && remaining > 0 && (
                    <Link href="/reserver" className="mt-3 block text-center text-sm text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-primary/5 transition-colors">
                      Utiliser un crédit
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Abonnements actifs */}
      <section className="mb-8">
        <h2 className="font-semibold text-foreground mb-4">Mes abonnements</h2>
        {subscriptions.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">Vous n'avez pas encore d'abonnement.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const pct = Math.round((sub.remainingCredits / sub.plan.totalCourses) * 100);
              const isActive = sub.status === "ACTIVE";
              const expiresSoon = isActive && new Date(sub.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              return (
                <div key={sub.id} className={`bg-card border rounded-xl p-5 ${!isActive ? "opacity-60 border-border" : expiresSoon ? "border-amber-300" : "border-border"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{sub.plan.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Du {formatDate(sub.startDate)} au {formatDate(sub.endDate)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? (expiresSoon ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700") : "bg-secondary text-muted-foreground"}`}>
                      {sub.status === "ACTIVE" ? (expiresSoon ? "Expire bientôt" : "Actif") : sub.status === "EXPIRED" ? "Expiré" : "Annulé"}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-foreground">{sub.remainingCredits} cours restants</span>
                      <span className="text-muted-foreground">{sub.plan.totalCourses} inclus · {formatPrice(Number(sub.plan.price))}</span>
                    </div>
                    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct > 50 ? "bg-primary" : pct > 20 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${Math.max(pct, 0)}%` }} />
                    </div>
                  </div>
                  {isActive && sub.remainingCredits > 0 && (
                    <div className="flex gap-2 mt-2">
                      <Link href="/reserver" className="flex-1 text-center text-sm text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-primary/5 transition-colors">
                        Réserver un cours
                      </Link>
                      <SubscriptionCancelButton subscriptionId={sub.id} planName={sub.plan.name} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Acheter un carnet */}
      {carnetPlans.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-foreground mb-2">Acheter un carnet de cours</h2>
          <p className="text-sm text-muted-foreground mb-4">Un carnet vous permet de réserver plusieurs cours à tarif avantageux.</p>
          <CarnetBuySection plans={carnetPlans.map((p) => ({ ...p, price: Number(p.price) }))} />
        </section>
      )}

      {/* Acheter un abonnement */}
      {plans.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-foreground mb-2">Souscrire un abonnement</h2>
          {hasActiveSubscription && (
            <p className="text-sm text-muted-foreground mb-4">Vous pouvez souscrire à une autre formule si elle est différente de votre abonnement actuel.</p>
          )}
          <SubscriptionBuySection plans={plans.map((p) => ({ ...p, price: Number(p.price) }))} />
        </section>
      )}

      {/* Avoirs */}
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
                       credit.reason === "credit_partial_remainder" ? "Reliquat après paiement partiel" :
                       credit.reason}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{formatDate(credit.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{formatPrice(Number(credit.amount))}</td>
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
