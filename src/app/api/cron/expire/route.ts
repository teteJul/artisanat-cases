import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Appelé quotidiennement pour expirer les abonnements, carnets et bons cadeaux échus
// Ex: curl https://artisanatcases.fr/api/cron/expire?secret=XXX

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();

  const pendingCutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000); // PENDING > 2h

  const [expiredSubs, stalePendingSubs, expiredCarnets, expiredVouchers] = await Promise.all([
    // Abonnements actifs dont la date de fin est dépassée
    prisma.subscription.updateMany({
      where: { status: "ACTIVE", endDate: { lt: now } },
      data: { status: "EXPIRED" },
    }),
    // Abonnements PENDING abandonnés (checkout Stripe non finalisé depuis + de 2h)
    // On annule plutôt que supprimer pour préserver les FK éventuelles
    prisma.subscription.updateMany({
      where: { status: "PENDING", createdAt: { lt: pendingCutoff } },
      data: { status: "CANCELLED" },
    }),
    // Carnets encore actifs dont la date d'expiration est dépassée
    prisma.carnet.updateMany({
      where: { isActive: true, expiresAt: { lt: now } },
      data: { isActive: false },
    }),
    // Bons cadeaux actifs dont la date d'expiration est dépassée
    prisma.giftVoucher.updateMany({
      where: { status: "ACTIVE", expiresAt: { lt: now } },
      data: { status: "EXPIRED" },
    }),
  ]);

  console.log(`[cron/expire] Abonnements expirés: ${expiredSubs.count}, PENDING supprimés: ${stalePendingSubs.count}, Carnets: ${expiredCarnets.count}, Bons cadeaux: ${expiredVouchers.count}`);

  return NextResponse.json({
    expiredSubscriptions: expiredSubs.count,
    deletedPendingSubscriptions: stalePendingSubs.count,
    expiredCarnets: expiredCarnets.count,
    expiredVouchers: expiredVouchers.count,
  });
}
