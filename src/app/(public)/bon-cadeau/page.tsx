import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BonCadeauForm } from "@/components/shared/bon-cadeau-form";

export const metadata: Metadata = {
  title: "Bons cadeaux",
  description: "Offrez un cours de poterie ou un atelier céramique en bon cadeau.",
};

export default async function BonCadeauPage() {
  const services = await prisma.serviceType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true, price: true, durationMinutes: true },
  });

  const serialized = services.map((s) => ({ ...s, price: Number(s.price) }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <p className="text-4xl mb-4">🎁</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Offrez un bon cadeau
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Un cadeau original et inoubliable, livré par email instantanément sous forme de PDF avec
          un code unique.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Formulaire */}
        <div className="lg:col-span-3">
          <BonCadeauForm services={serialized} />
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Comment ça marche ?</h3>
            <ol className="space-y-3">
              {[
                "Choisissez le service à offrir",
                "Renseignez vos coordonnées et celles du bénéficiaire (optionnel)",
                "Payez en ligne par carte",
                "Recevez le bon cadeau en PDF par email",
                "Le bénéficiaire entre son code sur son compte pour réserver",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="w-5 h-5 bg-primary/10 text-primary rounded-full text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-secondary/50 border border-border rounded-xl p-5 space-y-2 text-sm text-muted-foreground">
            <p>✅ Valable <strong>1 an</strong> à compter de la date d'achat</p>
            <p>✅ Pour tous nos services disponibles</p>
            <p>✅ Livré instantanément par email en PDF</p>
            <p>✅ Code unique sécurisé</p>
          </div>
        </div>
      </div>
    </div>
  );
}
