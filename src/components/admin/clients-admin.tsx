"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";
import { Search, ChevronRight, BookOpen, CreditCard, Calendar } from "lucide-react";

interface Client {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  _count: {
    bookings: number;
    carnets: number;
    subscriptions: number;
  };
}

export function ClientsAdmin({ initialClients }: { initialClients: Client[] }) {
  const [search, setSearch] = useState("");

  const filtered = initialClients.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Tableau */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Réservations</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Carnets</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Abonnements</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Inscrit le</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Aucun client trouvé</td></tr>
              )}
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                    {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{client._count.bookings}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className={`font-medium ${client._count.carnets > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {client._count.carnets}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className={`font-medium ${client._count.subscriptions > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {client._count.subscriptions}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Voir <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
