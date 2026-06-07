import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { courseSlotId } = await req.json();

  const existing = await prisma.waitlist.findUnique({
    where: { userId_courseSlotId: { userId: session.user.id, courseSlotId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Vous êtes déjà en liste d'attente" }, { status: 409 });
  }

  const entry = await prisma.waitlist.create({
    data: { userId: session.user.id, courseSlotId },
  });

  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { courseSlotId } = await req.json();

  await prisma.waitlist.deleteMany({
    where: { userId: session.user.id, courseSlotId },
  });

  return NextResponse.json({ success: true });
}
