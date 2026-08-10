import Link from "next/link";
import { ArrowRight, Star, Clock, Users, Gift } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

const TYPE_EMOJI: Record<string, string> = {
  COLLECTIVE_POTTERY: "🏺",
  PAINTING: "🎨",
  PRIVATE_POTTERY: "✨",
  PRIVATE_GROUP_POTTERY: "✨",
  BIRTHDAY: "🎂",
  COURS: "📚",
};

export default async function HomePage() {
  const [services, paintingPieces] = await Promise.all([
    prisma.serviceType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.paintingPiece.findMany({
      where: { isAvailable: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-accent via-background to-secondary min-h-[85vh] flex items-center">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b5552a' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="max-w-2xl">
              <p className="text-primary font-medium text-sm uppercase tracking-widest mb-4">
                Atelier de poterie · Pyrénées-Orientales
              </p>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
                Modelez votre
                <span className="text-primary block">passion</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Découvrez la douceur de l'argile dans notre atelier chaleureux. Cours collectifs,
                ateliers peinture sur céramique, cours particuliers — pour tous les niveaux et tous
                les âges.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/reserver"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Réserver un cours
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
                >
                  Découvrir nos cours
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Nos cours et nos ateliers
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Que vous soyez débutant ou confirmé, nous avons le cours qu'il vous faut.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="text-3xl mb-4">{TYPE_EMOJI[service.type] ?? "🏺"}</div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {service.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {service.shortDescription ?? service.description ?? ""}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-primary font-semibold">{formatPrice(Number(service.price))}</span>
                  <Link
                    href="/services"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    En savoir plus <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/reserver"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Voir le planning et réserver
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Peinture en boutique */}
        <section className="bg-accent/40 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-primary text-sm font-medium uppercase tracking-widest mb-2">
                  À venir
                </p>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Peinture sur céramique en boutique
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Venez peindre directement dans notre boutique sur des tables dédiées. Choisissez
                  votre pièce et laissez libre cours à votre créativité.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Des créneaux dédiés sont également disponibles à la réservation pour les groupes
                  et ateliers planifiés.
                </p>
                <Link
                  href="/tarifs"
                  className="inline-flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors text-sm"
                >
                  Voir les pièces disponibles
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {paintingPieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="bg-card border border-border rounded-lg p-4 text-center"
                  >
                    <p className="text-sm font-medium text-foreground">{piece.name}</p>
                    <p className="text-primary font-semibold text-sm mt-1">{formatPrice(Number(piece.price))}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Avantages */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bons cadeaux CTA */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <Gift className="w-10 h-10 mx-auto mb-4 opacity-80" />
            <h2 className="font-heading text-3xl font-bold mb-3">Offrez un cours de poterie</h2>
            <p className="opacity-80 mb-6 leading-relaxed">
              Un cadeau original et inoubliable ! Nos bon cadeau sont valables pour tous nos
              services et livré par email en quelques instants.
            </p>
            <Link
              href="/bon-cadeau"
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary-foreground/90 transition-colors"
            >
              Offrir un bon cadeau
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

const features = [
  {
    icon: Clock,
    title: "Créneaux flexibles",
    description: "Réservez jusqu'à 2 mois à l'avance selon vos disponibilités.",
  },
  {
    icon: Users,
    title: "Petits groupes",
    description: "Maximum 10 personnes par cours pour un accompagnement personnalisé.",
  },
  {
    icon: Star,
    title: "Tous niveaux",
    description: "Débutant ou expérimenté, nos cours s'adaptent à votre niveau.",
  },
  {
    icon: Gift,
    title: "Bon cadeau",
    description: "Offrez une expérience créative à vos proches, livré par email.",
  },
];
