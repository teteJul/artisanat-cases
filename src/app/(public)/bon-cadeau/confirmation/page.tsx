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
  searchParams: Promise<{ voucherId?: string; code?: string }>;
}) {
  const { voucherId, code } = await searchParams;

  // Support ancien lien ?code=... et nouveau lien ?voucherId=...
  const voucher = voucherId
    ? await prisma.giftVoucher.findUnique({ where: { id: voucherId } })
    : code
    ? await prisma.giftVoucher.findUnique({ where: { code } })
    : null;

  if (!voucher) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-destructive font-medium mb-4">Bon cadeau introuvable.</p>
        <Link href="/bon-cadeau" className="text-primary hover:underline text-sm">Acheter un bon cadeau</Link>
      </div>
    );
  }

  // Si encore PENDING, vérifier le paiement Stripe avant d'afficher une erreur
  if (voucher.status === "PENDING" && voucher.stripeSessionId) {
    try {
      const stripeSession = await stripe.checkout.sessions.retrieve(voucher.stripeSessionId);
      if (stripeSession.payment_status === "paid") {
        const serviceName = voucher.description?.replace("Bon cadeau — ", "") ?? "cours";
        const expiresStr = voucher.expiresAt
          ? voucher.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
          : "1 an après l'achat";

        await prisma.giftVoucher.update({
          where: { id: voucher.id },
          data: {
            status: "ACTIVE",
            stripePaymentId: stripeSession.payment_intent as string,
            emailSentAt: new Date(),
          },
        });

        const recipients = [voucher.purchaserEmail!].filter(Boolean);
        if (voucher.recipientEmail && voucher.recipientEmail !== voucher.purchaserEmail) {
          recipients.push(voucher.recipientEmail);
        }

        resend.emails.send({
          from: EMAIL_FROM,
          to: recipients,
          subject: `Votre bon cadeau Artisanat Cases — Code : ${voucher.code}`,
          react: VoucherConfirmationEmail({
            purchaserName: voucher.purchaserName ?? "Client",
            serviceName,
            code: voucher.code,
            expiresAt: expiresStr,
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          }),
        }).catch((e) => console.error("[bon-cadeau confirmation] Email échoué:", e));

        // Continuer avec le rendu succès (voucher est maintenant ACTIVE)
      } else {
        return (
          <div className="max-w-lg mx-auto px-4 py-24 text-center">
            <p className="text-destructive font-medium mb-4">
              Le paiement n'a pas encore été confirmé. Vérifiez votre email de confirmation Stripe.
            </p>
            <Link href="/bon-cadeau" className="text-primary hover:underline text-sm">Acheter un bon cadeau</Link>
          </div>
        );
      }
    } catch (e) {
      console.error("[bon-cadeau confirmation] Stripe check échoué:", e);
      return (
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <p className="text-destructive font-medium mb-4">Impossible de vérifier le paiement. Veuillez réessayer.</p>
          <Link href="/bon-cadeau" className="text-primary hover:underline text-sm">Retour</Link>
        </div>
      );
    }
  }

  // Envoyer l'email si webhook l'a activé mais n'a pas envoyé l'email
  if (voucher.status === "ACTIVE" && !voucher.emailSentAt && voucher.purchaserEmail) {
    try {
      const serviceName = voucher.description?.replace("Bon cadeau — ", "") ?? "cours";
      const expiresStr = voucher.expiresAt
        ? voucher.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        : "1 an après l'achat";
      const recipients = [voucher.purchaserEmail];
      if (voucher.recipientEmail && voucher.recipientEmail !== voucher.purchaserEmail) {
        recipients.push(voucher.recipientEmail);
      }
      await prisma.giftVoucher.update({ where: { id: voucher.id }, data: { emailSentAt: new Date() } });
      resend.emails.send({
        from: EMAIL_FROM,
        to: recipients,
        subject: `Votre bon cadeau Artisanat Cases — Code : ${voucher.code}`,
        react: VoucherConfirmationEmail({
          purchaserName: voucher.purchaserName ?? "Client",
          serviceName,
          code: voucher.code,
          expiresAt: expiresStr,
          appUrl: process.env.NEXT_PUBLIC_APP_URL!,
        }),
      }).catch((e) => console.error("[bon-cadeau confirmation] Email échoué:", e));
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
