import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { addWeeks, addDays } from "date-fns";

const createSlotSchema = z.object({
  serviceTypeId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  maxParticipants: z.number().optional(),
  notes: z.string().optional(),
  recurrence: z.object({
    type: z.enum(["none", "weekly", "biweekly", "monthly"]),
    count: z.number().min(1).max(52),
  }).optional(),
});

async function checkAdmin(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await checkAdmin(req);
  if (!session) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json();
  const parsed = createSlotSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { serviceTypeId, startTime, endTime, maxParticipants, notes, recurrence } = parsed.data;

  const serviceType = await prisma.serviceType.findUnique({ where: { id: serviceTypeId } });
  if (!serviceType) return NextResponse.json({ error: "Service introuvable" }, { status: 404 });

  const capacity = maxParticipants ?? serviceType.maxParticipants;
  const slots = [];
  const recurrenceId = recurrence?.type !== "none" ? `recurrence-${Date.now()}` : undefined;

  const count = recurrence?.type !== "none" ? (recurrence?.count ?? 1) : 1;

  for (let i = 0; i < count; i++) {
    let start = new Date(startTime);
    let end = new Date(endTime);

    if (recurrence?.type === "weekly") {
      start = addWeeks(new Date(startTime), i);
      end = addWeeks(new Date(endTime), i);
    } else if (recurrence?.type === "biweekly") {
      start = addWeeks(new Date(startTime), i * 2);
      end = addWeeks(new Date(endTime), i * 2);
    } else if (recurrence?.type === "monthly") {
      start = new Date(startTime);
      start.setMonth(start.getMonth() + i);
      end = new Date(endTime);
      end.setMonth(end.getMonth() + i);
    }

    slots.push({
      serviceTypeId,
      startTime: start,
      endTime: end,
      maxParticipants: capacity,
      notes,
      recurrenceId,
    });
  }

  const created = await prisma.courseSlot.createMany({ data: slots });

  return NextResponse.json({ created: created.count });
}

export async function GET(req: NextRequest) {
  const session = await checkAdmin(req);
  if (!session) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const slots = await prisma.courseSlot.findMany({
    where: {
      ...(from || to ? {
        startTime: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        }
      } : {}),
    },
    include: {
      serviceType: true,
      bookings: {
        where: { status: { notIn: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ADMIN"] } },
        include: { participants: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      },
      waitlists: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(slots);
}
