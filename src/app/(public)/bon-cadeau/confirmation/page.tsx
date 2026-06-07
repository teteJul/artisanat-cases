import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = { title: "Bon cadeau confirmé" };

export default function BonCadeauConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
      <h1 className="font-heading text-3xl font-bold text-foreground mb-3">
        Bon cadeau créé !
      </h1>
      <p className="text-muted-foreground mb-6 leading-relaxed">
        Votre bon cadeau a bien été généré et envoyé par email. Le bénéficiaire pourra utiliser son
        code pour réserver son cours directement sur le site.
      </p>
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <p className="text-sm text-muted-foreground mb-1">Un email avec le PDF a été envoyé à votre adresse.</p>
        <p className="text-xs text-muted-foreground">
          Pensez à vérifier vos spams si vous ne le recevez pas dans quelques minutes.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="border border-border px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
        >
          Retour à l'accueil
        </Link>
        <Link
          href="/bon-cadeau"
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Offrir un autre bon cadeau
        </Link>
      </div>
    </div>
  );
}
