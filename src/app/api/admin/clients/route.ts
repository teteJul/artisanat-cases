import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";

  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: {
        select: {
          bookings: { where: { status: "CONFIRMED" } },
          carnets: { where: { isActive: true } },
          subscriptions: { where: { status: "ACTIVE" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}
