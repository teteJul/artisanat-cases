import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  token: z.string(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { email, token, password } = parsed.data;

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!record) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });
    return NextResponse.json({ error: "Ce lien a expiré. Faites une nouvelle demande." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { email }, data: { password: hashed } });
  await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });

  return NextResponse.json({ success: true });
}
