import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Tous les tarifs des cours de poterie et ateliers céramique — à l'unité, carnet, engagement annuel.",
};

export const revalidate = 60;

export default async function TarifsPage() {
  const [services, pieces, plans] = await Promise.all([
    prisma.serviceType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.paintingPiece.findMany({ where: { isAvailable: true }, orderBy: { sortOrder: "asc" } }),
    prisma.subscriptionPlan.findMany({ where: { isActive: true } }),
  ]);

  const collectif = services.filter((s) => s.type === "COLLECTIVE_POTTERY");
  const peinture = services.filter((s) => s.type === "PAINTING");
  const particulier = services.filter((s) => s.type === "PRIVATE_POTTERY" || s.type === "PRIVATE_GROUP_POTTERY");
  const anniversaire = services.filter((s) => s.type === "BIRTHDAY");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-4">Tarifs</h1>
        <p className="text-muted-foreground text-lg">
          Des formules pour tous les rythmes et tous les budgets.
        </p>
      </div>

      {/* Cours collectifs */}
      <section className="mb-14">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
          <span className="text-3xl">🏺</span> Cours collectifs poterie
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* À l'unité */}
          {collectif.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">À l'unité</p>
              <p className="font-heading text-3xl font-bold text-primary">{formatPrice(Number(s.price))}</p>
              <p className="text-muted-foreground text-sm mt-1">par personne · {s.durationMinutes} min</p>
              <ul className="mt-4 space-y-1.5 text-sm text-foreground">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />Mercredi & Samedi</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />Réservation pour plusieurs</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />2 créneaux consécutifs possibles</li>
              </ul>
            </div>
          ))}

          {/* Carnet */}
          <div className="bg-primary/5 border border-primary/30 rounded-xl p-6 relative">
            <span className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
              Populaire
            </span>
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Carnet 10 cours</p>
            <p className="font-heading text-3xl font-bold text-primary">120€</p>
            <p className="text-muted-foreground text-sm mt-1">soit 12€/cours · valable 1 an</p>
            <ul className="mt-4 space-y-1.5 text-sm text-foreground">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />Réservez quand vous voulez</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />Crédits pour plusieurs personnes</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />Valable 1 an</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Engagements annuels */}
      {plans.length > 0 && (
        <section className="mb-14">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
            <span className="text-3xl">📚</span> Engagement à l'année
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Du 1er septembre au 4 juillet · Hors vacances scolaires · Créneau flexible chaque semaine
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-card border border-border rounded-xl p-6">
                <p className="font-semibold text-foreground mb-1">{plan.name}</p>
                <p className="font-heading text-3xl font-bold text-primary mt-2">
                  {formatPrice(Number(plan.price))}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {plan.totalCourses} cours · soit{" "}
                  {formatPrice(Number(plan.price) / plan.totalCourses)}/cours
                </p>
                {plan.description && (
                  <p className="text-muted-foreground text-xs mt-3">{plan.description}</p>
                )}
                <ul className="mt-4 space-y-1.5 text-sm text-foreground">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />Nominatif (1 personne)</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />Créneau flexible</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />Bon cadeau offert</li>
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Peinture céramique */}
      {peinture.length > 0 && (
        <section className="mb-14">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <span className="text-3xl">🎨</span> Atelier peinture sur céramique
          </h2>
          <div className="bg-card border border-border rounded-xl p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <p className="font-semibold text-foreground">Réservation du créneau</p>
                <p className="text-muted-foreground text-sm">Paiement en ligne à la réservation</p>
              </div>
              <p className="font-heading text-3xl font-bold text-primary sm:ml-auto">5€</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-amber-800 text-sm font-medium">
              💡 Le prix de la pièce que vous peignez est réglé directement sur place, en fonction de votre choix.
            </p>
          </div>
          <p className="font-semibold text-foreground mb-3">Tarifs des pièces à peindre :</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pieces.map((p) => (
              <div key={p.id} className="bg-secondary/50 border border-border rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-primary font-bold mt-1">{formatPrice(Number(p.price))}</p>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs mt-3">
            🏪 Également disponible sans réservation en boutique, sur les tables dédiées.
          </p>
        </section>
      )}

      {/* Cours particuliers */}
      {particulier.length > 0 && (
        <section className="mb-14">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <span className="text-3xl">✨</span> Cours particuliers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {particulier.map((s) => (
              <div key={s.id} className="bg-card border border-border rounded-xl p-6">
                <p className="font-semibold text-foreground">{s.name}</p>
                <p className="text-muted-foreground text-sm mt-1">{s.durationMinutes} min · max {s.maxParticipants} pers.</p>
                <p className="font-heading text-3xl font-bold text-primary mt-3">{formatPrice(Number(s.price))}</p>
                {s.description && <p className="text-muted-foreground text-xs mt-2">{s.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Anniversaire */}
      {anniversaire.length > 0 && (
        <section className="mb-14">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <span className="text-3xl">🎂</span> Anniversaire enfant
          </h2>
          {anniversaire.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {s.durationMinutes} min · min 5 enfants, max {s.maxParticipants} enfants (3 à 15 ans) · max 3 adultes
                  </p>
                  <ul className="mt-4 space-y-1.5 text-sm text-foreground">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />2h de poterie</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />Décoration de l'atelier possible</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary shrink-0" />Bon cadeau 1 cours offert à l'enfant fêté 🎁</li>
                  </ul>
                </div>
                <div className="text-right">
                  <p className="font-heading text-3xl font-bold text-primary">{formatPrice(Number(s.price))}</p>
                  <p className="text-muted-foreground text-sm">par enfant</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Bons cadeaux */}
      <section className="bg-primary text-primary-foreground rounded-2xl p-8 text-center">
        <p className="text-3xl mb-3">🎁</p>
        <h3 className="font-heading text-2xl font-bold mb-3">Bons cadeaux</h3>
        <p className="opacity-80 mb-5">
          Offrez une expérience unique ! Disponibles pour tous nos services, livrés par email en PDF.
        </p>
        <Link
          href="/bon-cadeau"
          className="inline-flex items-center gap-2 bg-primary-foreground text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary-foreground/90 transition-colors"
        >
          Acheter un bon cadeau <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* CTA réservation */}
      <div className="text-center mt-10">
        <Link
          href="/reserver"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Réserver un cours <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
