import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { addWeeks, setHours, setMinutes, nextWednesday, nextSaturday } from "date-fns";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@artisanatcases.fr" },
    update: {},
    create: {
      email: "admin@artisanatcases.fr",
      name: "Admin Artisanat Cases",
      firstName: "Admin",
      lastName: "Cases",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Client de test
  const clientPassword = await bcrypt.hash("client123", 12);
  await prisma.user.upsert({
    where: { email: "client@test.fr" },
    update: {},
    create: {
      email: "client@test.fr",
      name: "Marie Dupont",
      firstName: "Marie",
      lastName: "Dupont",
      phone: "0600000000",
      password: clientPassword,
      role: "CLIENT",
    },
  });

  // Services
  const collectifPoterie = await prisma.serviceType.upsert({
    where: { id: "service-collectif-poterie" },
    update: {},
    create: {
      id: "service-collectif-poterie",
      name: "Cours collectif poterie",
      description: "Cours de poterie en groupe de 1h30. Ouvert à tous les niveaux.",
      shortDescription: "1h30 en groupe, mercredi & samedi",
      type: "COLLECTIVE_POTTERY",
      durationMinutes: 90,
      price: 15,
      maxParticipants: 10,
      allowMultiPerson: true,
      allowCarnet: true,
      color: "#b5552a",
    },
  });

  await prisma.serviceType.upsert({
    where: { id: "service-peinture" },
    update: {},
    create: {
      id: "service-peinture",
      name: "Atelier peinture céramique",
      description: "Peignez et décorez des pièces en céramique. 5€ de réservation + pièce choisie payée sur place.",
      type: "PAINTING",
      durationMinutes: 90,
      price: 5,
      maxParticipants: 8,
      allowMultiPerson: true,
      allowCarnet: false,
      color: "#7a9e7e",
    },
  });

  await prisma.serviceType.upsert({
    where: { id: "service-particulier" },
    update: {},
    create: {
      id: "service-particulier",
      name: "Cours particulier poterie",
      description: "Accompagnement personnalisé en 2h30.",
      type: "PRIVATE_POTTERY",
      durationMinutes: 150,
      price: 50,
      maxParticipants: 1,
      allowMultiPerson: false,
      allowCarnet: false,
      color: "#4a7fa5",
    },
  });

  await prisma.serviceType.upsert({
    where: { id: "service-groupe" },
    update: {},
    create: {
      id: "service-groupe",
      name: "Cours particulier groupe",
      description: "Cours pour un groupe privé jusqu'à 6 personnes, 3h.",
      type: "PRIVATE_GROUP_POTTERY",
      durationMinutes: 180,
      price: 80,
      maxParticipants: 6,
      allowMultiPerson: true,
      allowCarnet: false,
      color: "#9b5de5",
    },
  });

  await prisma.serviceType.upsert({
    where: { id: "service-anniversaire" },
    update: {},
    create: {
      id: "service-anniversaire",
      name: "Anniversaire enfant",
      description: "Fête d'anniversaire créative — 2h poterie. 12€/enfant, min 5 max 10 enfants.",
      type: "BIRTHDAY",
      durationMinutes: 120,
      price: 12,
      maxParticipants: 10,
      allowMultiPerson: true,
      allowCarnet: false,
      color: "#f72585",
    },
  });

  // Plans d'abonnement
  await prisma.subscriptionPlan.upsert({
    where: { id: "plan-2-semaine" },
    update: {},
    create: {
      id: "plan-2-semaine",
      name: "Engagement 2 cours/semaine",
      description: "36 cours sur l'année scolaire (1er sept. → 4 juil.), hors vacances scolaires.",
      coursesPerCycle: 2,
      cycleType: "weekly",
      totalCourses: 36,
      price: 330,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { id: "plan-1-deux-semaines" },
    update: {},
    create: {
      id: "plan-1-deux-semaines",
      name: "Engagement 1 cours/2 semaines",
      description: "20 cours sur l'année scolaire, hors vacances scolaires.",
      coursesPerCycle: 1,
      cycleType: "biweekly",
      totalCourses: 20,
      price: 200,
    },
  });

  // Créneaux collectifs : prochains mercredis et samedis
  const now = new Date();
  const slots = [];

  let wednesday = nextWednesday(now);
  let saturday = nextSaturday(now);

  for (let i = 0; i < 8; i++) {
    // Mercredi 14h-15h30
    const wed1Start = setMinutes(setHours(addWeeks(wednesday, i), 14), 0);
    const wed1End = setMinutes(setHours(addWeeks(wednesday, i), 15), 30);
    slots.push({ start: wed1Start, end: wed1End });

    // Mercredi 15h30-17h
    const wed2Start = setMinutes(setHours(addWeeks(wednesday, i), 15), 30);
    const wed2End = setMinutes(setHours(addWeeks(wednesday, i), 17), 0);
    slots.push({ start: wed2Start, end: wed2End });

    // Samedi 14h-15h30
    const sat1Start = setMinutes(setHours(addWeeks(saturday, i), 14), 0);
    const sat1End = setMinutes(setHours(addWeeks(saturday, i), 15), 30);
    slots.push({ start: sat1Start, end: sat1End });

    // Samedi 15h30-17h
    const sat2Start = setMinutes(setHours(addWeeks(saturday, i), 15), 30);
    const sat2End = setMinutes(setHours(addWeeks(saturday, i), 17), 0);
    slots.push({ start: sat2Start, end: sat2End });
  }

  for (const slot of slots) {
    await prisma.courseSlot.create({
      data: {
        serviceTypeId: "service-collectif-poterie",
        startTime: slot.start,
        endTime: slot.end,
        maxParticipants: 10,
      },
    });
  }

  // Pièces peinture céramique
  const pieces = [
    { name: "Assiette", price: 10 },
    { name: "Mug / Tasse", price: 6 },
    { name: "Bol", price: 7 },
    { name: "Vase", price: 12 },
    { name: "Pot", price: 8 },
    { name: "Saladier", price: 14 },
    { name: "Théière mini", price: 15 },
    { name: "Salière", price: 5 },
    { name: "Poivrière", price: 5 },
    { name: "Petite coupe", price: 6 },
    { name: "Grande coupe", price: 10 },
    { name: "Bougeoir", price: 8 },
    { name: "Porte-savon", price: 7 },
    { name: "Coupelle", price: 4 },
    { name: "Pichet", price: 13 },
  ];

  for (let i = 0; i < pieces.length; i++) {
    await prisma.paintingPiece.upsert({
      where: { id: `piece-${i + 1}` },
      update: {},
      create: { id: `piece-${i + 1}`, ...pieces[i], sortOrder: i },
    });
  }

  // Paramètres app
  await prisma.appSetting.upsert({
    where: { key: "site_name" },
    update: {},
    create: { key: "site_name", value: "Artisanat Cases" },
  });

  await prisma.appSetting.upsert({
    where: { key: "booking_advance_days" },
    update: {},
    create: { key: "booking_advance_days", value: "60" },
  });

  await prisma.appSetting.upsert({
    where: { key: "cancellation_deadline_hours" },
    update: {},
    create: { key: "cancellation_deadline_hours", value: "48" },
  });

  console.log("✅ Seed terminé !");
  console.log(`   Admin : admin@artisanatcases.fr / admin123`);
  console.log(`   Client test : client@test.fr / client123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
