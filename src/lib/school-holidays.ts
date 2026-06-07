import { prisma } from "@/lib/prisma";

const ZONE_C_API_URL =
  "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records?where=zones%3D%22Zone%20C%22&limit=100&order_by=start_date";

interface ApiRecord {
  fields: {
    description: string;
    start_date: string;
    end_date: string;
    zones: string;
    location: string;
    annee_scolaire: string;
  };
}

export async function syncSchoolHolidays(year?: number): Promise<void> {
  const targetYear = year ?? new Date().getFullYear();

  try {
    const url = `${ZONE_C_API_URL}&where=zones%3D%22Zone%20C%22%20AND%20start_date%3E%3D%22${targetYear - 1}-09-01%22%20AND%20end_date%3C%3D%22${targetYear + 1}-07-31%22`;
    const res = await fetch(url);
    if (!res.ok) return;

    const data = await res.json();
    const records: ApiRecord[] = data.results ?? [];

    for (const record of records) {
      const { description, start_date, end_date, annee_scolaire } = record.fields;
      const yearNum = parseInt(annee_scolaire?.split("-")[0] ?? String(targetYear));

      await prisma.schoolHoliday.upsert({
        where: {
          // pas d'unique sur plusieurs champs, on crée une clé composite
          id: `zone-c-${slugifyName(description)}-${start_date}`,
        },
        update: {},
        create: {
          id: `zone-c-${slugifyName(description)}-${start_date}`,
          name: description,
          startDate: new Date(start_date),
          endDate: new Date(end_date),
          zone: "C",
          year: yearNum,
          isManual: false,
        },
      });
    }
  } catch {
    // Si l'API échoue on garde les données existantes
  }
}

function slugifyName(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function isHolidayPeriod(date: Date): Promise<boolean> {
  const holidays = await prisma.schoolHoliday.findMany({
    where: {
      startDate: { lte: date },
      endDate: { gte: date },
    },
  });
  return holidays.length > 0;
}

// Vacances d'été : juillet et août (pas de cours collectifs)
export function isSummerPeriod(date: Date): boolean {
  const month = date.getMonth(); // 0-indexed
  return month === 6 || month === 7; // juillet = 6, août = 7
}
