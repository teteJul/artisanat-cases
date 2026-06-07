import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Découvrez les pièces de céramique disponibles à l'achat dans notre boutique physique.",
};

export const revalidate = 60;

export default async function CataloguePage() {
  const items = await prisma.catalogItem.findMany({
    where: { isAvailable: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Boutique
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Toutes nos pièces sont façonnées à la main dans notre atelier. Chaque création est unique.
        </p>
      </div>

      {/* Bandeau boutique physique */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center gap-4">
        <MapPin className="w-8 h-8 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-foreground">Vente uniquement en boutique physique</p>
          <p className="text-muted-foreground text-sm mt-0.5">
            Nos pièces ne sont pas vendues en ligne. Venez nous rendre visite pour découvrir et
            repartir avec votre coup de cœur !
          </p>
        </div>
        <Link
          href="/contact"
          className="shrink-0 border border-primary text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Nous contacter
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-5xl mb-4">🏺</p>
          <p>Le catalogue sera bientôt disponible.</p>
          <p className="text-sm mt-2">N'hésitez pas à nous contacter pour en savoir plus.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-xl overflow-hidden group hover:shadow-lg hover:border-primary/30 transition-all"
            >
              {/* Image */}
              <div className="aspect-square bg-secondary/50 relative overflow-hidden">
                {item.imageUrls[0] ? (
                  <Image
                    src={item.imageUrls[0]}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground">
                    🏺
                  </div>
                )}
                {item.imageUrls.length > 1 && (
                  <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                    +{item.imageUrls.length - 1}
                  </span>
                )}
              </div>

              {/* Infos */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                {item.description && (
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <p className="text-primary text-xs font-medium mt-3">
                  Disponible en boutique
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA ateliers */}
      <div className="mt-16 text-center bg-accent/40 border border-border rounded-2xl p-10">
        <h3 className="font-heading text-2xl font-bold text-foreground mb-3">
          Créez votre propre pièce
        </h3>
        <p className="text-muted-foreground mb-5">
          Rejoignez l'un de nos ateliers et façonnez vous-même votre céramique.
        </p>
        <Link
          href="/reserver"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Réserver un cours
        </Link>
      </div>
    </div>
  );
}
