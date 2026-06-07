"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { TrendingUp, Users, BookOpen, CalendarDays, Clock } from "lucide-react";

interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookingCount: number;
}

interface FillRate {
  name: string;
  totalSlots: number;
  avgFillRate: number;
}

interface Summary {
  totalClients: number;
  activeSubscriptions: number;
  activeCarnets: number;
  pendingWaitlists: number;
  revenueThisMonth: number;
  bookingsThisMonth: number;
}

interface ExpiringCarnet {
  id: string;
  totalCredits: number;
  usedCredits: number;
  expiresAt: string;
  user: { firstName: string; lastName: string; email: string };
}

interface ReportingData {
  monthlyRevenue: MonthlyRevenue[];
  fillRateByService: FillRate[];
  summary: Summary;
  expiringCarnets: ExpiringCarnet[];
}

export default function ReportingPage() {
  const [data, setData] = useState<ReportingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/reporting?months=${months}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [months]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground">Chargement du reporting...</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, monthlyRevenue, fillRateByService, expiringCarnets } = data;
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Reporting</h1>
          <p className="text-muted-foreground mt-1">Analyse des performances de l'activité</p>
        </div>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="border border-input rounded-lg px-3 py-2 text-sm bg-background"
        >
          <option value={3}>3 derniers mois</option>
          <option value={6}>6 derniers mois</option>
          <option value={12}>12 derniers mois</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: "CA ce mois", value: formatPrice(summary.revenueThisMonth), icon: TrendingUp, color: "text-green-600" },
          { label: "Réservations ce mois", value: summary.bookingsThisMonth.toString(), icon: CalendarDays, color: "text-blue-600" },
          { label: "Clients total", value: summary.totalClients.toString(), icon: Users, color: "text-purple-600" },
          { label: "Abonnements actifs", value: summary.activeSubscriptions.toString(), icon: BookOpen, color: "text-orange-600" },
          { label: "Carnets actifs", value: summary.activeCarnets.toString(), icon: BookOpen, color: "text-pink-600" },
          { label: "Listes d'attente", value: summary.pendingWaitlists.toString(), icon: Clock, color: "text-amber-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* CA mensuel */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Chiffre d'affaires mensuel</h2>
          <div className="space-y-3">
            {monthlyRevenue.map((m) => (
              <div key={m.month}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground capitalize">{m.month}</span>
                  <span className="font-medium text-foreground">
                    {formatPrice(m.revenue)}
                    <span className="text-xs text-muted-foreground ml-2">({m.bookingCount} rés.)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(m.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Taux de remplissage */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Taux de remplissage par service</h2>
          {fillRateByService.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée sur la période</p>
          ) : (
            <div className="space-y-4">
              {fillRateByService.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{s.avgFillRate}% · {s.totalSlots} créneaux</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${
                        s.avgFillRate >= 80 ? "bg-green-500" : s.avgFillRate >= 50 ? "bg-amber-500" : "bg-red-400"
                      }`}
                      style={{ width: `${s.avgFillRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Carnets expirant bientôt */}
      {expiringCarnets.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">
            Carnets expirant dans 30 jours ({expiringCarnets.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Client</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Crédits restants</th>
                  <th className="pb-2 font-medium">Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expiringCarnets.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 font-medium text-foreground">
                      {c.user.firstName} {c.user.lastName}
                    </td>
                    <td className="py-2 text-muted-foreground">{c.user.email}</td>
                    <td className="py-2">{c.totalCredits - c.usedCredits} / {c.totalCredits}</td>
                    <td className="py-2 text-amber-600">
                      {new Date(c.expiresAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
