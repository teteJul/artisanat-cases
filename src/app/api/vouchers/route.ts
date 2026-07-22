import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { randomBytes } from "crypto";

const purchaseSchema = z.object({
  serviceTypeId: z.string(),
  purchaserName: z.string(),
  purchaserEmail: z.string().email(),
  recipientEmail: z.string().email().optional(),
  message: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { serviceTypeId, purchaserName, purchaserEmail, recipientEmail } = parsed.data;

  const serviceType = await prisma.serviceType.findUnique({ where: { id: serviceTypeId, isActive: true } });
  if (!serviceType) return NextResponse.json({ error: "Service introuvable ou inactif" }, { status: 404 });

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  // Retry sur collision de code unique (P2002)
  let voucher;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      voucher = await prisma.giftVoucher.create({
        data: {
          code: generateVoucherCode(),
          serviceTypeId,
          purchaserName,
          purchaserEmail,
          recipientEmail: recipientEmail || null,
          description: `Bon cadeau — ${serviceType.name}`,
          status: "PENDING",
          expiresAt,
          amountValue: serviceType.price,
        },
      });
      break;
    } catch (e: unknown) {
      if ((e as { code?: string })?.code !== "P2002" || attempt === 4) throw e;
    }
  }
  if (!voucher) return NextResponse.json({ error: "Erreur lors de la création du bon cadeau" }, { status: 500 });

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Bon cadeau — ${serviceType.name}`,
            description: "Bon cadeau valable 1 an",
          },
          unit_amount: Math.round(Number(serviceType.price) * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: purchaserEmail,
    // Utiliser l'ID (pas le code) dans l'URL — le code reste côté serveur
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bon-cadeau/confirmation?voucherId=${voucher.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/bon-cadeau?cancelled=true`,
    metadata: { voucherId: voucher.id, recipientEmail: recipientEmail ?? "" },
  });

  await prisma.giftVoucher.update({
    where: { id: voucher.id },
    data: { stripeSessionId: stripeSession.id },
  });

  return NextResponse.json({ checkoutUrl: stripeSession.url, voucherId: voucher.id });
}

// Réclamer un bon cadeau sur son compte
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { code } = await req.json();

  const voucher = await prisma.giftVoucher.findUnique({ where: { code } });
  if (!voucher) return NextResponse.json({ error: "Code invalide" }, { status: 404 });
  if (voucher.status !== "ACTIVE") return NextResponse.json({ error: "Ce bon cadeau a déjà été utilisé ou est expiré" }, { status: 400 });
  if (voucher.ownerId) return NextResponse.json({ error: "Ce bon cadeau est déjà rattaché à un compte" }, { status: 400 });
  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return NextResponse.json({ error: "Ce bon cadeau est expiré" }, { status: 400 });
  }

  await prisma.giftVoucher.update({
    where: { code },
    data: { ownerId: session.user.id },
  });

  return NextResponse.json({ success: true, voucher });
}

function generateVoucherCode(): string {
  const part = () => randomBytes(3).toString("hex").toUpperCase().substring(0, 4);
  return `${part()}-${part()}`;
}
