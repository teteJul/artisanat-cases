export function computeEndDate(startDate: Date, cycleType: string): Date {
  const end = new Date(startDate);
  switch (cycleType.toLowerCase()) {
    case "monthly":
    case "mensuel":
      end.setMonth(end.getMonth() + 1);
      break;
    case "quarterly":
    case "trimestriel":
      end.setMonth(end.getMonth() + 3);
      break;
    case "semestrial":
    case "semestriel":
    case "semester":
      end.setMonth(end.getMonth() + 6);
      break;
    case "yearly":
    case "annuel":
    case "annual":
    default:
      end.setFullYear(end.getFullYear() + 1);
  }
  return end;
}

// Retourne true si la date est en heure d'été de Paris (CEST = UTC+2)
// Calcul basé sur les règles européennes : dernier dimanche de mars → dernier dimanche d'octobre
export function isParisDST(date: Date): boolean {
  const year = date.getUTCFullYear();
  const dstStart = new Date(Date.UTC(year, 2, lastSundayOfMonth(year, 2), 1, 0, 0));
  const dstEnd = new Date(Date.UTC(year, 9, lastSundayOfMonth(year, 9), 1, 0, 0));
  return date >= dstStart && date < dstEnd;
}

export function parisOffsetMinutes(date: Date): number {
  return isParisDST(date) ? 120 : 60;
}

function lastSundayOfMonth(year: number, month: number): number {
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  return lastDay.getUTCDate() - lastDay.getUTCDay();
}
