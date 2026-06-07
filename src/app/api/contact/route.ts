import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(2),
  message: z.string().min(10),
});

export async function POST(req: NextRequest) {
  const parsed = contactSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, email, phone, subject, message } = parsed.data;

  const [adminResult, userResult] = await Promise.allSettled([
    resend.emails.send({
      from: EMAIL_FROM,
      to: "manon@artisanatcases.fr",
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `
        <h2>Nouveau message de contact</h2>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        ${phone ? `<p><strong>Téléphone :</strong> ${phone}</p>` : ""}
        <p><strong>Sujet :</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    }),
    resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Votre message a bien été reçu — Artisanat Cases",
      html: `
        <h2>Merci pour votre message, ${name} !</h2>
        <p>Nous avons bien reçu votre message et vous répondrons dans les meilleurs délais.</p>
        <p style="color:#9a6b50;font-size:13px;">— L'équipe Artisanat Cases</p>
      `,
    }),
  ]);

  if (adminResult.status === "rejected" && userResult.status === "rejected") {
    return NextResponse.json({ error: "Erreur lors de l'envoi des emails" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
