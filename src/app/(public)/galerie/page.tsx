import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { GalerieGrid } from "@/components/shared/galerie-grid";

export const metadata: Metadata = {
  title: "Galerie",
  description: "Découvrez les créations de l'atelier Artisanat Cases — poterie et céramique.",
};

export const revalidate = 60;

export default async function GaleriePage() {
  const images = await prisma.galleryImage.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Galerie
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Les créations nées dans notre atelier — chaque pièce est unique, façonnée à la main.
        </p>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-5xl mb-4">🏺</p>
          <p>La galerie sera bientôt disponible.</p>
        </div>
      ) : (
        <GalerieGrid images={images} />
      )}
    </div>
  );
}
