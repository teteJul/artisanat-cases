import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN" ? session : null;
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const carnets = await prisma.carnet.findMany({
    include: {
      user: { select: { id: true, firstName: true, lastName: true, name: true, email: true } },
      serviceType: { select: { id: true, name: true } },
    },
    orderBy: { purchasedAt: "desc" },
  });

  return NextResponse.json(
    carnets.map((c) => ({ ...c, totalCredits: c.totalCredits, usedCredits: c.usedCredits }))
  );
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  await prisma.$transaction([
    prisma.booking.updateMany({ where: { carnetId: id }, data: { carnetId: null } }),
    prisma.carnet.delete({ where: { id } }),
  ]);
  return NextResponse.json({ success: true });
}
