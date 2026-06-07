import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CatalogueAdmin } from "@/components/admin/catalogue-admin";

export const metadata: Metadata = { title: "Admin — Catalogue" };

export default async function AdminCataloguePage() {
  const [items, pieces] = await Promise.all([
    prisma.catalogItem.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.paintingPiece.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const serializedPieces = pieces.map((p) => ({ ...p, price: Number(p.price) }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Catalogue & Pièces céramique</h1>
        <p className="text-muted-foreground mt-1">
          Gérez le catalogue boutique et les pièces disponibles pour l'atelier peinture.
        </p>
      </div>
      <CatalogueAdmin initialItems={items} initialPieces={serializedPieces} />
    </div>
  );
}
