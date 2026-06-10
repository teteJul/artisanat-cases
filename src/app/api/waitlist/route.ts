import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";

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

  const [entry, slot, user] = await Promise.all([
    prisma.waitlist.create({ data: { userId: session.user.id, courseSlotId } }),
    prisma.courseSlot.findUnique({
      where: { id: courseSlotId },
      include: { serviceType: true },
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  if (slot && user) {
    const slotDate = new Date(slot.startTime);
    resend.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject: `Inscription liste d'attente — ${slot.serviceType.name}`,
      html: `
        <h2>Vous êtes sur la liste d'attente !</h2>
        <p>Bonjour ${user.firstName ?? user.name ?? "Client"},</p>
        <p>Vous avez bien été ajouté à la liste d'attente pour :</p>
        <ul>
          <li><strong>Cours :</strong> ${slot.serviceType.name}</li>
          <li><strong>Date :</strong> ${slotDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</li>
          <li><strong>Heure :</strong> ${slotDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</li>
        </ul>
        <p>Vous recevrez un email dès qu'une place se libère.</p>
        <p style="color:#9a6b50;font-size:13px;">— L'équipe Artisanat Cases</p>
      `,
    }).catch((e) => console.error("[waitlist] Email échoué:", e));
  }

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
