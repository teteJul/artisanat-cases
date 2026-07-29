import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const schema = z.object({ planId: z.string() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Identifiant de plan invalide" }, { status: 400 });

  const plan = await prisma.carnetPlan.findUnique({
    where: { id: parsed.data.planId, isActive: true },
    include: { serviceType: true },
  });
  if (!plan) return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + plan.validityMonths);

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: plan.name,
            description: `${plan.numberOfSessions} cours — ${plan.serviceType.name} — valable ${plan.validityMonths} mois`,
          },
          unit_amount: Math.round(Number(plan.price) * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/mon-espace/carnets?carnetSuccess=true&sessionId=${"{CHECKOUT_SESSION_ID}"}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/mon-espace/carnets?carnetCancelled=true`,
    metadata: {
      carnetPlanId: plan.id,
      userId: session.user.id,
      serviceTypeId: plan.serviceTypeId,
      numberOfSessions: String(plan.numberOfSessions),
      validityMonths: String(plan.validityMonths),
    },
  });

  return NextResponse.json({ checkoutUrl: stripeSession.url });
}
