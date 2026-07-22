import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resend, EMAIL_FROM } from "@/lib/resend";
import SubscriptionConfirmationEmail from "@/../emails/subscription-confirmation";
import { computeEndDate } from "@/lib/subscriptions";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN" ? session : null;
}

const createSchema = z.object({
  userId: z.string(),
  planId: z.string(),
  startDate: z.string().optional(),
  sendEmail: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const subscriptions = await prisma.subscription.findMany({
    where: status ? { status: status as "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING" } : {},
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    subscriptions.map((s) => ({ ...s, plan: { ...s.plan, price: Number(s.plan.price) } }))
  );
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { userId, planId, startDate: startDateStr, sendEmail } = parsed.data;

  const [user, plan] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.subscriptionPlan.findUnique({ where: { id: planId } }),
  ]);

  if (!user || !plan) return NextResponse.json({ error: "Utilisateur ou plan introuvable" }, { status: 404 });

  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  const endDate = computeEndDate(startDate, plan.cycleType);

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId,
      status: "ACTIVE",
      remainingCredits: plan.totalCourses,
      startDate,
      endDate,
    },
  });

  if (sendEmail) {
    resend.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject: `Votre abonnement ${plan.name} est activé`,
      react: SubscriptionConfirmationEmail({
        clientName: user.firstName ?? user.name ?? "Client",
        planName: plan.name,
        totalCourses: plan.totalCourses,
        startDate: startDate.toLocaleDateString("fr-FR"),
        endDate: endDate.toLocaleDateString("fr-FR"),
        price: `${Number(plan.price).toFixed(2)} €`,
        appUrl: process.env.NEXT_PUBLIC_APP_URL!,
      }),
    }).catch((e) => console.error("[admin subscription] Email échoué:", e));
  }

  return NextResponse.json({ ...subscription });
}
