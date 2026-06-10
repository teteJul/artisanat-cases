import Link from "next/link";
import { MapPin, Mail, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Identité */}
          <div>
            <h3 className="font-heading text-lg text-background mb-3">Artisanat Cases</h3>
            <p className="text-sm leading-relaxed text-background/60">
              Atelier de poterie dans les Pyrénées-Orientales. Venez découvrir la magie de l'argile
              dans un cadre chaleureux et bienveillant.
            </p>
          </div>

          {/* Infos pratiques */}
          <div>
            <h4 className="text-sm font-semibold text-background mb-3 uppercase tracking-wider">
              Infos pratiques
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>Mercredi & Samedi<br />14h–15h30 / 15h30–17h</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <a href="mailto:manon@artisanatcases.fr" className="hover:text-background transition-colors">
                  manon@artisanatcases.fr
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-background mb-3 uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-1.5 text-sm">
              {[
                { href: "/services", label: "Nos cours" },
                { href: "/tarifs", label: "Tarifs" },
                { href: "/catalogue", label: "Boutique" },
                { href: "/galerie", label: "Galerie" },
                { href: "/reserver", label: "Réserver" },
                { href: "/bon-cadeau", label: "Bons cadeaux" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-background/10 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-background/40">
          <p>© {new Date().getFullYear()} Artisanat Cases. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/mentions-legales" className="hover:text-background/60 transition-colors">Mentions légales</Link>
            <Link href="/politique-confidentialite" className="hover:text-background/60 transition-colors">Confidentialité</Link>
            <Link href="/cgv" className="hover:text-background/60 transition-colors">CGV</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
