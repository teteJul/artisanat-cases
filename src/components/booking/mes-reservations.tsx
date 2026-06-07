"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatTime, formatPrice, canCancelBooking } from "@/lib/utils";
import { Calendar, Clock, Users, ChevronDown, ChevronUp, Loader2, ArrowRight } from "lucide-react";

interface Booking {
  id: string;
  status: string;
  paymentMethod: string;
  amountPaid: number | null;
  cancelledAt: string | null;
  createdAt: string;
  slot: {
    startTime: string;
    endTime: string;
    serviceType: { name: string; color: string | null; price: number };
  };
  participants: { id: string; firstName: string; lastName: string; isMainBooker: boolean }[];
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmée", className: "bg-green-100 text-green-700" },
  PENDING: { label: "Paiement en attente", className: "bg-amber-100 text-amber-700" },
  CANCELLED_BY_CLIENT: { label: "Annulée", className: "bg-red-100 text-red-600" },
  CANCELLED_BY_ADMIN: { label: "Annulée par l'atelier", className: "bg-red-100 text-red-600" },
  COMPLETED: { label: "Terminée", className: "bg-secondary text-muted-foreground" },
  NO_SHOW: { label: "Absent", className: "bg-secondary text-muted-foreground" },
};

const PAYMENT_LABELS: Record<string, string> = {
  STRIPE: "Carte bancaire", CARNET: "Carnet", SUBSCRIPTION: "Abonnement",
  GIFT_VOUCHER: "Bon cadeau", CREDIT: "Avoir", ON_SITE: "Sur place",
};

function BookingCard({ booking, showCancel = false, cancellationDeadlineHours = 48 }: { booking: Booking; showCancel?: boolean; cancellationDeadlineHours?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelStep, setCancelStep] = useState<"idle" | "confirm" | "done">("idle");
  const [cancelAction, setCancelAction] = useState<"credit" | "refund">("credit");

  const canCancel = showCancel && canCancelBooking(booking.slot.startTime, cancellationDeadlineHours);
  const statusInfo = STATUS_LABELS[booking.status] ?? { label: booking.status, className: "bg-secondary" };

  async function handleCancel() {
    setCancelling(true);
    await fetch(`/api/bookings/${booking.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: cancelAction }),
    });
    setCancelling(false);
    setCancelStep("done");
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Couleur service */}
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{ backgroundColor: booking.slot.serviceType.color ?? "#b5552a" }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold text-foreground">{booking.slot.serviceType.name}</p>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(booking.slot.startTime, "EEEE d MMMM yyyy")}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(booking.slot.startTime)} → {formatTime(booking.slot.endTime)}
                  </span>
                  {booking.participants.length > 1 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      {booking.participants.length} participants
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
                {booking.amountPaid ? (
                  <span className="text-sm font-semibold text-primary">{formatPrice(booking.amountPaid)}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-5"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Masquer les détails" : "Voir les détails"}
        </button>
      </div>

      {/* Détails expandés */}
      {expanded && (
        <div className="border-t border-border bg-secondary/20 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Participants</p>
              <div className="space-y-1">
                {booking.participants.map((p) => (
                  <p key={p.id} className="text-foreground">
                    {p.isMainBooker ? "👤 " : "  "}{p.firstName} {p.lastName}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Paiement</p>
              <p className="text-foreground">{PAYMENT_LABELS[booking.paymentMethod] ?? booking.paymentMethod}</p>
              {booking.amountPaid ? <p className="text-primary font-medium">{formatPrice(booking.amountPaid)}</p> : <p className="text-muted-foreground">Inclus dans votre formule</p>}
              <p className="text-xs text-muted-foreground mt-2">Réf: {booking.id.slice(0, 8)}...</p>
            </div>
          </div>

          {/* Annulation */}
          {showCancel && booking.status === "CONFIRMED" && (
            <div className="border-t border-border pt-4">
              {cancelStep === "done" ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  ✅ Réservation annulée. {cancelAction === "credit" ? "Un avoir a été crédité sur votre compte." : "Un remboursement a été initié."}
                </div>
              ) : cancelStep === "confirm" ? (
                <div className="space-y-3">
                  {canCancel ? (
                    <>
                      <p className="text-sm text-foreground font-medium">Comment souhaitez-vous être remboursé ?</p>
                      <div className="flex gap-4">
                        {[
                          { value: "credit", label: "💳 Avoir en compte" },
                          { value: "refund", label: "↩ Remboursement carte" },
                        ].map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" value={opt.value} checked={cancelAction === opt.value} onChange={() => setCancelAction(opt.value as "credit" | "refund")} />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800 font-medium">⚠ Annulation tardive</p>
                      <p className="text-xs text-amber-600 mt-0.5">Moins de {cancellationDeadlineHours}h avant le cours — le cours sera considéré comme utilisé, sans remboursement.</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setCancelStep("idle")} className="flex-1 border border-border py-2 rounded-lg text-sm hover:bg-secondary">
                      Retour
                    </button>
                    <button onClick={handleCancel} disabled={cancelling} className="flex-1 bg-destructive text-white py-2 rounded-lg text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 flex items-center justify-center gap-2">
                      {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirmer l'annulation
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCancelStep("confirm")}
                  className="text-sm text-destructive hover:underline"
                >
                  Annuler cette réservation
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MesReservations({ upcoming, past, cancellationDeadlineHours = 48 }: { upcoming: Booking[]; past: Booking[]; cancellationDeadlineHours?: number }) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg w-fit">
        <button onClick={() => setTab("upcoming")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "upcoming" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          À venir ({upcoming.length})
        </button>
        <button onClick={() => setTab("past")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "past" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          Historique ({past.length})
        </button>
      </div>

      {tab === "upcoming" && (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Aucun cours à venir.</p>
              <Link href="/reserver" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Réserver un cours <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {upcoming.map((b) => <BookingCard key={b.id} booking={b} showCancel cancellationDeadlineHours={cancellationDeadlineHours} />)}
              <div className="text-center pt-4">
                <Link href="/reserver" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  Réserver un autre cours <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "past" && (
        <div className="space-y-3">
          {past.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucun historique pour l'instant.</div>
          ) : (
            past.map((b) => <BookingCard key={b.id} booking={b} />)
          )}
        </div>
      )}
    </div>
  );
}
