import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function checkAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN" ? session : null;
}

const itemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrls: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export async function GET() {
  const items = await prisma.catalogItem.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const parsed = itemSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const item = await prisma.catalogItem.create({ data: parsed.data });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id, ...data } = await req.json();
  const item = await prisma.catalogItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await req.json();
  await prisma.catalogItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
