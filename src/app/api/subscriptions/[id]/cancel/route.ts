import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import SubscriptionCancelledEmail from "@/../emails/subscription-cancelled";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const subscription = await prisma.subscription.findFirst({
    where: { id, userId: session.user.id, status: "ACTIVE" },
    include: { plan: true, user: true },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Abonnement introuvable ou non annulable" }, { status: 404 });
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
  }).catch((e) => console.error("[subscription cancel] Email échoué:", e));

  return NextResponse.json({ success: true });
}
