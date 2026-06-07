import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // Réponse identique même si l'email n'existe pas (sécurité)
  if (!user) return NextResponse.json({ success: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await prisma.verificationToken.upsert({
    where: { identifier_token: { identifier: email, token: "reset" } },
    update: { token, expires },
    create: { identifier: email, token, expires },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reinitialiser-mot-de-passe?token=${token}&email=${encodeURIComponent(email)}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Réinitialisation de votre mot de passe — Artisanat Cases",
    html: `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
      <a href="${resetUrl}" style="background:#b5552a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">
        Réinitialiser mon mot de passe
      </a>
      <p style="color:#666;font-size:13px;">Ce lien est valable 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `,
  });

  return NextResponse.json({ success: true });
}
