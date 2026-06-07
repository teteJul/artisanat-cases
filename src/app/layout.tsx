import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Artisanat Cases — Atelier de poterie",
    template: "%s | Artisanat Cases",
  },
  description:
    "Atelier de poterie dans les Pyrénées-Orientales. Cours collectifs, cours particuliers, ateliers peinture sur céramique. Réservez votre cours en ligne.",
  keywords: ["poterie", "céramique", "atelier", "cours", "Pyrénées-Orientales", "artisanat"],
  openGraph: {
    title: "Artisanat Cases — Atelier de poterie",
    description: "Cours de poterie et ateliers céramique dans les Pyrénées-Orientales.",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${playfair.variable} ${lato.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
