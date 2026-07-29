import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.carnetPlan.findMany({
    where: { isActive: true },
    include: { serviceType: { select: { id: true, name: true, allowCarnet: true } } },
    orderBy: { price: "asc" },
  });
  return NextResponse.json(plans.map((p) => ({ ...p, price: Number(p.price) })));
}
