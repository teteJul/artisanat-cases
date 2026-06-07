import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nos cours et services",
  description: "Découvrez tous nos cours de poterie et ateliers céramique.",
};

const TYPE_LABELS: Record<string, string> = {
  COLLECTIVE_POTTERY: "Cours collectif",
  PRIVATE_POTTERY: "Cours particulier",
  PRIVATE_GROUP_POTTERY: "Cours particulier groupe",
  PAINTING: "Atelier peinture",
  BIRTHDAY: "Anniversaire",
};

export default async function ServicesPage() {
  const services = await prisma.serviceType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const serialized = services.map((s) => ({
    ...s,
    price: Number(s.price),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Nos cours & ateliers
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Des formules adaptées à tous les profils, du débutant au passionné confirmé.
        </p>
      </div>

      {serialized.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>Aucun service disponible pour le moment.</p>
          <p className="text-sm mt-2">Revenez bientôt !</p>
        </div>
      ) : (
        <div className="space-y-8">
          {serialized.map((service) => (
            <section key={service.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="bg-primary/10 px-8 py-6 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-foreground">
                      {service.name}
                    </h2>
                    {service.shortDescription && (
                      <p className="text-muted-foreground mt-1">{service.shortDescription}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {TYPE_LABELS[service.type] ?? service.type}
                  </span>
                </div>
              </div>

              <div className="p-8">
                {service.description && (
                  <p className="text-foreground leading-relaxed mb-6">{service.description}</p>
                )}

                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="bg-secondary/50 rounded-xl px-5 py-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Tarif</p>
                    <p className="text-primary text-2xl font-bold">{formatPrice(service.price)}</p>
                    <p className="text-xs text-muted-foreground">par personne</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl px-5 py-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Durée</p>
                    <p className="text-foreground text-2xl font-bold">{service.durationMinutes} min</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl px-5 py-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Capacité</p>
                    <p className="text-foreground text-2xl font-bold">{service.maxParticipants}</p>
                    <p className="text-xs text-muted-foreground">personnes max</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6 text-sm text-muted-foreground">
                  {service.allowMultiPerson && (
                    <span className="bg-secondary/50 rounded-lg px-3 py-1">
                      ✅ Réservation multi-personnes
                    </span>
                  )}
                  {service.allowCarnet && (
                    <span className="bg-secondary/50 rounded-lg px-3 py-1">
                      ✅ Carnet de cours accepté
                    </span>
                  )}
                </div>

                <Link
                  href="/reserver"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Réserver <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="text-center bg-primary/10 border border-primary/20 rounded-2xl p-10 mt-12">
        <h3 className="font-heading text-2xl font-bold text-foreground mb-3">
          🎁 Offrez un cours en bon cadeau
        </h3>
        <p className="text-muted-foreground mb-5">
          Disponibles pour tous nos services. Livrés par email en PDF avec un code unique.
        </p>
        <Link
          href="/bon-cadeau"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Acheter un bon cadeau <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
