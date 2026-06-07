import Link from "next/link";
import { ArrowRight, Star, Clock, Users, Gift } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
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

        {/* Services aperçu */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Nos ateliers
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Que vous soyez débutant ou confirmé, nous avons le cours qu'il vous faut.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="text-3xl mb-4">{service.emoji}</div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-primary font-semibold">{service.price}</span>
                  <Link
                    href={service.href}
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
                  Sans rendez-vous
                </p>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Peinture sur céramique en boutique
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Venez peindre directement dans notre boutique sur des tables dédiées — pas besoin
                  de réserver ! Choisissez votre pièce et laissez libre cours à votre créativité.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Des créneaux dédiés sont également disponibles à la réservation pour les groupes
                  et ateliers planifiés.
                </p>
                <Link
                  href="/services#peinture"
                  className="inline-flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors text-sm"
                >
                  Voir les pièces disponibles
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {paintingPieces.map((piece) => (
                  <div
                    key={piece.name}
                    className="bg-card border border-border rounded-lg p-4 text-center"
                  >
                    <div className="text-2xl mb-2">{piece.emoji}</div>
                    <p className="text-sm font-medium text-foreground">{piece.name}</p>
                    <p className="text-primary font-semibold text-sm mt-1">{piece.price}</p>
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
              Un cadeau original et inoubliable ! Nos bons cadeaux sont valables pour tous nos
              services et livrés par email en quelques instants.
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

const services = [
  {
    emoji: "🏺",
    title: "Cours collectifs poterie",
    description:
      "Séances de 1h30 en groupe. Idéales pour débuter ou progresser dans une ambiance conviviale. Mercredi et samedi.",
    price: "À partir de 12€/cours",
    href: "/services#collectif",
  },
  {
    emoji: "🎨",
    title: "Atelier peinture céramique",
    description:
      "Peignez et décorez des pièces en céramique. Accessible à tous, même sans expérience artistique.",
    price: "5€ + pièce choisie",
    href: "/services#peinture",
  },
  {
    emoji: "✨",
    title: "Cours particuliers",
    description:
      "Un accompagnement personnalisé pour progresser rapidement à votre rythme. Seul ou en petit groupe.",
    price: "À partir de 50€",
    href: "/services#particulier",
  },
  {
    emoji: "🎂",
    title: "Anniversaires enfants",
    description:
      "Une fête créative inoubliable ! 2h de poterie + bon cadeau pour l'enfant fêté. De 5 à 10 enfants.",
    price: "12€/enfant",
    href: "/services#anniversaire",
  },
  {
    emoji: "📚",
    title: "Engagement à l'année",
    description:
      "Progressez régulièrement avec un engagement annuel. La formule la plus économique pour les passionnés.",
    price: "Dès 200€/an",
    href: "/tarifs#engagement",
  },
  {
    emoji: "🗂️",
    title: "Carnet 10 cours",
    description:
      "Réservez selon votre planning avec souplesse. Valable 1 an sur les cours collectifs.",
    price: "120€ les 10 cours",
    href: "/tarifs#carnet",
  },
];

const paintingPieces = [
  { emoji: "🍽️", name: "Assiette", price: "10€" },
  { emoji: "☕", name: "Mug / Tasse", price: "6€" },
  { emoji: "🥣", name: "Bol", price: "7€" },
  { emoji: "🏺", name: "Vase", price: "12€" },
];

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
    title: "Bons cadeaux",
    description: "Offrez une expérience créative à vos proches, livrée par email.",
  },
];
