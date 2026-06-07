import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const vouchers = await prisma.giftVoucher.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    vouchers.map((v) => ({
      ...v,
      amountValue: v.amountValue ? Number(v.amountValue) : null,
      expiresAt: v.expiresAt?.toISOString() ?? null,
      redeemedAt: v.redeemedAt?.toISOString() ?? null,
      createdAt: v.createdAt.toISOString(),
      purchasedAt: v.purchasedAt.toISOString(),
    }))
  );
}
