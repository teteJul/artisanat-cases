import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  serviceTypeId: z.string(),
  numberOfSessions: z.number().int().min(1),
  price: z.number().positive(),
  validityMonths: z.number().int().min(1).default(12),
});

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const plans = await prisma.carnetPlan.findMany({
    include: { serviceType: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(plans.map((p) => ({ ...p, price: Number(p.price) })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const plan = await prisma.carnetPlan.create({ data: parsed.data });
  return NextResponse.json({ ...plan, price: Number(plan.price) });
}
