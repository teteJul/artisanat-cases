import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { firstName, lastName, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      phone,
      password: hashed,
      role: "CLIENT",
    },
  });

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Bienvenue chez Artisanat Cases !",
    html: `
      <h2>Bienvenue ${firstName} !</h2>
      <p>Votre compte a bien été créé sur Artisanat Cases.</p>
      <p>Vous pouvez dès maintenant réserver vos cours de poterie et ateliers créatifs.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/reserver" style="background:#b5552a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Réserver un cours</a>
    `,
  });

  return NextResponse.json({ success: true, userId: user.id });
}
