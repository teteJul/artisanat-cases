import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { key, value } = await req.json();
  const setting = await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return NextResponse.json(setting);
}

export async function GET() {
  const settings = await prisma.appSetting.findMany();
  return NextResponse.json(Object.fromEntries(settings.map((s) => [s.key, s.value])));
}
