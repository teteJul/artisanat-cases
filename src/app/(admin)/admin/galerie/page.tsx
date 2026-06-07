import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { GalerieAdmin } from "@/components/admin/galerie-admin";

export const metadata: Metadata = { title: "Admin — Galerie" };

export default async function AdminGaleriePage() {
  const images = await prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Galerie</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les photos affichées sur la page galerie du site.
        </p>
      </div>
      <GalerieAdmin initialImages={images} />
    </div>
  );
}
