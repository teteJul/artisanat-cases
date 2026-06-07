import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function checkAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN" ? session : null;
}

export async function GET() {
  const images = await prisma.galleryImage.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(images);
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json();
  const schema = z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    sortOrder: z.number().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const image = await prisma.galleryImage.create({ data: parsed.data });
  return NextResponse.json(image);
}

export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;
  const image = await prisma.galleryImage.update({ where: { id }, data });
  return NextResponse.json(image);
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await req.json();
  await prisma.galleryImage.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
