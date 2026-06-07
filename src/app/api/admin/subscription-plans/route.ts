import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const planSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  coursesPerCycle: z.number().int().min(1),
  cycleType: z.string().min(1),
  totalCourses: z.number().int().min(1),
  price: z.number().min(0),
  isActive: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return false;
  return true;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const parsed = planSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const plan = await prisma.subscriptionPlan.create({ data: parsed.data });
  return NextResponse.json({ ...plan, price: Number(plan.price) });
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const plan = await prisma.subscriptionPlan.update({ where: { id }, data });
  return NextResponse.json({ ...plan, price: Number(plan.price) });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  await prisma.subscriptionPlan.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
