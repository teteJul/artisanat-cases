import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function checkAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN" ? session : null;
}

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  type: z.enum(["COLLECTIVE_POTTERY","PRIVATE_POTTERY","PRIVATE_GROUP_POTTERY","PAINTING","BIRTHDAY"]),
  durationMinutes: z.number().int().positive(),
  price: z.number().positive(),
  maxParticipants: z.number().int().positive().default(10),
  allowMultiPerson: z.boolean().default(false),
  allowCarnet: z.boolean().default(false),
  isActive: z.boolean().default(true),
  color: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function GET() {
  const services = await prisma.serviceType.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const parsed = serviceSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const service = await prisma.serviceType.create({ data: parsed.data });
  return NextResponse.json(service);
}

export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id, ...data } = await req.json();
  const service = await prisma.serviceType.update({ where: { id }, data });
  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await req.json();
  await prisma.serviceType.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
