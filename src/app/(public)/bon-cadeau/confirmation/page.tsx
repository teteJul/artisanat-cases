import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { resend, EMAIL_FROM } from "@/lib/resend";
import VoucherConfirmationEmail from "@/../emails/voucher-confirmation";

export const metadata: Metadata = { title: "Bon cadeau confirmé" };

export default async function BonCadeauConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  // Valider que le bon cadeau existe
  const voucher = code
    ? await prisma.giftVoucher.findUnique({ where: { code } })
    : null;

  if (!voucher) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-destructive font-medium mb-4">Bon cadeau introuvable.</p>
        <Link href="/bon-cadeau" className="text-primary hover:underline text-sm">
          Acheter un bon cadeau
        </Link>
      </div>
    );
  }

  // Envoyer l'email si pas encore fait
  if (!voucher.emailSentAt && voucher.purchaserEmail) {
    try {
      let paymentConfirmed = false;

      if (voucher.stripeSessionId) {
        const stripeSession = await stripe.checkout.sessions.retrieve(voucher.stripeSessionId);
        paymentConfirmed = stripeSession.payment_status === "paid";
        if (paymentConfirmed && !voucher.stripePaymentId) {
          await prisma.giftVoucher.update({
            where: { code: voucher.code },
            data: { stripePaymentId: stripeSession.payment_intent as string },
          });
        }
      }

      if (paymentConfirmed) {
        await prisma.giftVoucher.update({
          where: { code: voucher.code },
          data: { emailSentAt: new Date() },
        });

        const serviceName = voucher.description?.replace("Bon cadeau — ", "") ?? "cours";
        const expiresAt = voucher.expiresAt
          ? voucher.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
          : "1 an après l'achat";

        await resend.emails.send({
          from: EMAIL_FROM,
          to: voucher.purchaserEmail,
          subject: `Votre bon cadeau Artisanat Cases — Code : ${voucher.code}`,
          react: VoucherConfirmationEmail({
            purchaserName: voucher.purchaserName ?? "Client",
            serviceName,
            code: voucher.code,
            expiresAt,
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          }),
        });
      }
    } catch (e) {
      console.error("[bon-cadeau confirmation] Erreur email:", e);
    }
  }

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
      <div className="bg-primary/5 border-2 border-dashed border-primary rounded-xl p-6 mb-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Votre code</p>
        <p className="text-3xl font-bold text-primary font-mono tracking-widest">{voucher.code}</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <p className="text-sm text-muted-foreground mb-1">Un email avec le code a été envoyé à votre adresse.</p>
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
