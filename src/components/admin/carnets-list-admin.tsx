"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ClientCarnet {
  id: string;
  totalCredits: number;
  usedCredits: number;
  isActive: boolean;
  purchasedAt: string;
  expiresAt: string;
  user: { id: string; firstName?: string | null; lastName?: string | null; name?: string | null; email: string };
  serviceType: { id: string; name: string };
}

export function CarnetsListAdmin({ initialCarnets }: { initialCarnets: ClientCarnet[] }) {
  const [carnets, setCarnets] = useState(initialCarnets);

  async function handleDelete(id: string, clientName: string) {
    if (!confirm(`Supprimer le carnet de ${clientName} ? Cette action est irréversible.`)) return;
    const res = await fetch("/api/admin/carnets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setCarnets(carnets.filter((c) => c.id !== id));
  }

  function clientName(c: ClientCarnet) {
    if (c.user.firstName || c.user.lastName) {
      return [c.user.firstName, c.user.lastName].filter(Boolean).join(" ");
    }
    return c.user.name ?? c.user.email;
  }

  if (carnets.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
        <p className="text-muted-foreground">Aucun carnet client pour l'instant.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 border-b border-border">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Service</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Cours</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Expiration</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {carnets.map((c) => {
            const remaining = c.totalCredits - c.usedCredits;
            const isExpired = !c.isActive || new Date(c.expiresAt) < new Date();
            const name = clientName(c);
            return (
              <tr key={c.id} className={isExpired ? "opacity-60" : ""}>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{c.user.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.serviceType.name}</td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-foreground">{remaining}</span>
                  <span className="text-muted-foreground">/{c.totalCredits}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{formatDate(c.expiresAt)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpired ? "bg-secondary text-muted-foreground" : "bg-green-100 text-green-700"}`}>
                    {isExpired ? "Expiré" : "Actif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(c.id, name)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
