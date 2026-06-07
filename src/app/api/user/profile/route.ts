import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { firstName, lastName, phone, currentPassword, newPassword } = parsed.data;

  const updateData: Record<string, string> = {};
  if (firstName) { updateData.firstName = firstName; updateData.name = `${firstName} ${lastName ?? ""}`; }
  if (lastName) { updateData.lastName = lastName; }
  if (phone !== undefined) updateData.phone = phone;

  // Changement de mot de passe
  if (newPassword && currentPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password) return NextResponse.json({ error: "Impossible de changer le mot de passe" }, { status: 400 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });

    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, name: true },
  });

  return NextResponse.json(updated);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, name: true, createdAt: true },
  });

  return NextResponse.json(user);
}
