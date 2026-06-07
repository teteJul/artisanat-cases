"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/services", label: "Nos cours" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/catalogue", label: "Boutique" },
  { href: "/galerie", label: "Galerie" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-heading text-xl font-semibold text-primary tracking-wide">
              Artisanat Cases
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Atelier de poterie
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-foreground/80 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA + Auth */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                {(session.user as { role?: string })?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <Link
                  href="/mon-espace"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  Mon espace
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <Link href="/connexion" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Connexion
              </Link>
            )}
            <Link
              href="/reserver"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Réserver
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-foreground"
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden py-4 border-t border-border space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-2 py-2.5 text-sm text-foreground/80 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border space-y-1">
              {session ? (
                <>
                  <Link href="/mon-espace" onClick={() => setOpen(false)} className="block px-2 py-2.5 text-sm">Mon espace</Link>
                  {(session.user as { role?: string })?.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setOpen(false)} className="block px-2 py-2.5 text-sm">Administration</Link>
                  )}
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full text-left px-2 py-2.5 text-sm text-destructive">Déconnexion</button>
                </>
              ) : (
                <Link href="/connexion" onClick={() => setOpen(false)} className="block px-2 py-2.5 text-sm">Connexion</Link>
              )}
              <Link
                href="/reserver"
                onClick={() => setOpen(false)}
                className="block mt-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-medium text-center"
              >
                Réserver un cours
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
