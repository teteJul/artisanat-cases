import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { computeEndDate } from "@/lib/subscriptions";

const schema = z.object({ planId: z.string() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: parsed.data.planId, isActive: true },
  });
  if (!plan) return NextResponse.json({ error: "Formule introuvable" }, { status: 404 });

  // Vérifier qu'il n'a pas déjà un abonnement ACTIVE sur ce plan
  const existing = await prisma.subscription.findFirst({
    where: { userId: session.user.id, planId: plan.id, status: "ACTIVE" },
  });
  if (existing) {
    return NextResponse.json({ error: "Vous avez déjà un abonnement actif sur cette formule" }, { status: 409 });
  }

  const startDate = new Date();
  const endDate = computeEndDate(startDate, plan.cycleType);

  // Créer la subscription PENDING
  const subscription = await prisma.subscription.create({
    data: {
      userId: session.user.id,
      planId: plan.id,
      status: "PENDING",
      remainingCredits: plan.totalCourses,
      startDate,
      endDate,
    },
  });

  // Créer la session Stripe
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: plan.name,
            description: `${plan.totalCourses} cours — valable jusqu'au ${endDate.toLocaleDateString("fr-FR")}`,
          },
          unit_amount: Math.round(Number(plan.price) * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/mon-espace/carnets?subSuccess=true&subscriptionId=${subscription.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/mon-espace/carnets?subCancelled=true`,
    metadata: { subscriptionId: subscription.id },
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { stripeSessionId: stripeSession.id },
  });

  return NextResponse.json({ checkoutUrl: stripeSession.url });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  return NextResponse.json(plans.map((p) => ({ ...p, price: Number(p.price) })));
}
