"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BookOpen,
  Package,
  ImageIcon,
  Gift,
  BarChart3,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/cours", label: "Cours & créneaux", icon: CalendarDays },
  { href: "/admin/reservations", label: "Réservations", icon: BookOpen },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/bons-cadeaux", label: "Bons cadeaux", icon: Gift },
  { href: "/admin/catalogue", label: "Catalogue", icon: Package },
  { href: "/admin/galerie", label: "Galerie", icon: ImageIcon },
  { href: "/admin/reporting", label: "Reporting", icon: BarChart3 },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="block">
          <p className="font-heading text-lg text-sidebar-primary-foreground tracking-wide">
            Artisanat Cases
          </p>
          <p className="text-xs text-sidebar-foreground/50 uppercase tracking-widest mt-0.5">
            Administration
          </p>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          ← Retour au site
        </Link>
      </div>
    </aside>
  );
}
