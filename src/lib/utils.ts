import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string | { toNumber: () => number }) {
  const num = typeof amount === "object" ? amount.toNumber() : Number(amount);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(num);
}

export function formatDate(date: Date | string, fmt = "dd MMMM yyyy") {
  return format(new Date(date), fmt, { locale: fr });
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "dd MMMM yyyy à HH:mm", { locale: fr });
}

export function formatTime(date: Date | string) {
  return format(new Date(date), "HH:mm", { locale: fr });
}

export function canCancelBooking(courseStartTime: Date | string, deadlineHours = 48): boolean {
  return differenceInHours(new Date(courseStartTime), new Date()) >= deadlineHours;
}

export function generateVoucherCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
