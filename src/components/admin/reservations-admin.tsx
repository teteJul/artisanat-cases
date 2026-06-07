"use client";

import { useState } from "react";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { Search, Users } from "lucide-react";

interface Booking {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  amountPaid: number | null;
  createdAt: string;
  user: { id: string; firstName: string | null; lastName: string | null; email: string; phone: string | null };
  slot: { startTime: string; endTime: string; serviceType: { name: string; color: string | null } };
  participants: { id: string; firstName: string; lastName: string; isMainBooker: boolean }[];
}

interface WaitlistEntry {
  id: string;
  createdAt: string;
  user: { id: string; firstName: string | null; lastName: string | null; email: string };
  slot: { id: string; startTime: string; serviceType: { name: string } };
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmée", className: "bg-green-100 text-green-700" },
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-700" },
  CANCELLED_BY_CLIENT: { label: "Annulée client", className: "bg-red-100 text-red-700" },
  CANCELLED_BY_ADMIN: { label: "Annulée admin", className: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Terminée", className: "bg-secondary text-muted-foreground" },
  NO_SHOW: { label: "Absent", className: "bg-secondary text-muted-foreground" },
};

const PAYMENT_LABELS: Record<string, string> = {
  STRIPE: "Carte", CARNET: "Carnet", SUBSCRIPTION: "Abonnement",
  GIFT_VOUCHER: "Bon cadeau", CREDIT: "Avoir", ON_SITE: "Sur place",
};

export function ReservationsAdmin({
  bookings,
  waitlists,
  defaultTab,
}: {
  bookings: Booking[];
  waitlists: WaitlistEntry[];
  defaultTab?: string;
}) {
  const [tab, setTab] = useState<"reservations" | "waitlist">(
    defaultTab === "waitlist" ? "waitlist" : "reservations"
  );
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${b.user.firstName} ${b.user.lastName}`.toLowerCase().includes(q) ||
      b.user.email.toLowerCase().includes(q) ||
      b.slot.serviceType.name.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredWaitlists = waitlists.filter((w) => {
    const q = search.toLowerCase();
    return !q || `${w.user.firstName} ${w.user.lastName}`.toLowerCase().includes(q) || w.user.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg w-fit">
        <button onClick={() => setTab("reservations")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "reservations" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          Réservations ({bookings.filter((b) => b.status === "CONFIRMED").length})
        </button>
        <button onClick={() => setTab("waitlist")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "waitlist" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          Liste d'attente ({waitlists.length})
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un client, un service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {tab === "reservations" && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tous les statuts</option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="PENDING">En attente</option>
            <option value="CANCELLED_BY_CLIENT">Annulées</option>
          </select>
        )}
      </div>

      {/* Réservations */}
      {tab === "reservations" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Paiement</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Montant</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Aucune réservation trouvée</td></tr>
                )}
                {filtered.map((booking) => {
                  const statusInfo = STATUS_LABELS[booking.status] ?? { label: booking.status, className: "bg-secondary" };
                  const isExpanded = expandedId === booking.id;
                  return (
                    <>
                      <tr
                        key={booking.id}
                        className="hover:bg-secondary/20 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{booking.user.firstName} {booking.user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{booking.user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: booking.slot.serviceType.color ?? "#b5552a" }} />
                            <span className="text-foreground">{booking.slot.serviceType.name}</span>
                          </div>
                          {booking.participants.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {booking.participants.length} pers.
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                          <p>{formatDate(booking.slot.startTime, "d MMM yyyy")}</p>
                          <p className="text-xs">{formatTime(booking.slot.startTime)}</p>
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{PAYMENT_LABELS[booking.paymentMethod] ?? booking.paymentMethod}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-primary hidden md:table-cell">
                          {booking.amountPaid ? formatPrice(booking.amountPaid) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${booking.id}-detail`} className="bg-secondary/10">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-foreground mb-1">Participants</p>
                                {booking.participants.map((p) => (
                                  <p key={p.id} className="text-muted-foreground text-xs">
                                    {p.isMainBooker ? "👤 " : "  "}{p.firstName} {p.lastName}
                                  </p>
                                ))}
                              </div>
                              <div>
                                <p className="font-medium text-foreground mb-1">Détails</p>
                                <p className="text-xs text-muted-foreground">Réf: {booking.id}</p>
                                <p className="text-xs text-muted-foreground">Créée le {formatDate(booking.createdAt, "d MMM yyyy à HH:mm")}</p>
                                {booking.user.phone && <p className="text-xs text-muted-foreground">📞 {booking.user.phone}</p>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Liste d'attente */}
      {tab === "waitlist" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Position</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Créneau souhaité</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredWaitlists.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">Aucune liste d'attente</td></tr>
              )}
              {filteredWaitlists.map((entry, i) => (
                <tr key={entry.id} className="hover:bg-secondary/20">
                  <td className="px-4 py-3 text-center font-medium text-foreground">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{entry.user.firstName} {entry.user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground">{entry.slot.serviceType.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.slot.startTime, "d MMM yyyy")} · {formatTime(entry.slot.startTime)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                    {formatDate(entry.createdAt, "d MMM yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
