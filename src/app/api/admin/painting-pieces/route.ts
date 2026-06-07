import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function checkAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN" ? session : null;
}

const pieceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export async function GET() {
  const pieces = await prisma.paintingPiece.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(pieces);
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const parsed = pieceSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const piece = await prisma.paintingPiece.create({ data: parsed.data });
  return NextResponse.json(piece);
}

export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id, ...data } = await req.json();
  const piece = await prisma.paintingPiece.update({ where: { id }, data: { ...data, price: data.price } });
  return NextResponse.json(piece);
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await req.json();
  await prisma.paintingPiece.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
