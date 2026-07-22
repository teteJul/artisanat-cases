import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import SubscriptionCancelledEmail from "@/../emails/subscription-cancelled";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

const putSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"]).optional(),
  remainingCredits: z.number().int().min(0).optional(),
  endDate: z.string().datetime().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const parsed = putSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { status, remainingCredits, endDate } = parsed.data;

  // Plafonner les crédits au total du plan
  let safeCredits = remainingCredits;
  if (remainingCredits !== undefined) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });
    if (!sub) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    safeCredits = Math.min(remainingCredits, sub.plan.totalCourses);
  }

  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(safeCredits !== undefined && { remainingCredits: safeCredits }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
    },
    include: { plan: true, user: true },
  });

  return NextResponse.json({ ...subscription, plan: { ...subscription.plan, price: Number(subscription.plan.price) } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true, user: true },
  });

  if (!subscription) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (subscription.status === "CANCELLED") {
    return NextResponse.json({ error: "Cet abonnement est déjà annulé" }, { status: 400 });
  }

  await prisma.subscription.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  resend.emails.send({
    from: EMAIL_FROM,
    to: subscription.user.email,
    subject: `Annulation de votre abonnement — ${subscription.plan.name}`,
    react: SubscriptionCancelledEmail({
      clientName: subscription.user.firstName ?? subscription.user.name ?? "Client",
      planName: subscription.plan.name,
      remainingCredits: subscription.remainingCredits,
      cancelledAt: new Date().toLocaleDateString("fr-FR"),
    }),
  }).catch((e) => console.error("[admin subscription delete] Email échoué:", e));

  return NextResponse.json({ success: true });
}
