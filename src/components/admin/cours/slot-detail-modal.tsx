"use client";

import { useState } from "react";
import { X, Users, Clock, Loader2, Trash2, XCircle, MailCheck } from "lucide-react";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";

interface SlotBooking {
  id: string;
  user: { firstName: string | null; lastName: string | null; email: string };
  participants: { id: string; firstName: string; lastName: string; isMainBooker: boolean }[];
  paymentMethod: string;
  amountPaid: number | null;
  status: string;
}

interface Slot {
  id: string;
  serviceType: { name: string; price: number; color: string | null };
  startTime: string;
  endTime: string;
  maxParticipants: number;
  isCancelled: boolean;
  cancelReason: string | null;
  recurrenceId: string | null;
  notes: string | null;
  bookings: SlotBooking[];
  waitlists: { id: string; user: { firstName: string | null; lastName: string | null; email: string } }[];
}

interface Props {
  slot: Slot;
  onClose: () => void;
  onUpdated: () => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  STRIPE: "Carte bancaire",
  CARNET: "Carnet",
  SUBSCRIPTION: "Abonnement",
  GIFT_VOUCHER: "Bon cadeau",
  CREDIT: "Avoir",
  ON_SITE: "Sur place",
};

export function SlotDetailModal({ slot, onClose, onUpdated }: Props) {
  const [cancelReason, setCancelReason] = useState("");
  const [cancelAction, setCancelAction] = useState<"refund" | "credit">("credit");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingPlaces, setEditingPlaces] = useState(false);
  const [newMaxParticipants, setNewMaxParticipants] = useState(slot.maxParticipants);
  const [placesError, setPlacesError] = useState("");
  const [placesLoading, setPlacesLoading] = useState(false);

  const booked = slot.bookings.filter((b) => b.status === "CONFIRMED").length;
  const revenue = slot.bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + Number(b.amountPaid ?? 0), 0);

  async function handleCancel() {
    setLoading(true);
    await fetch(`/api/admin/slots/${slot.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: cancelReason, action: cancelAction }),
    });
    setLoading(false);
    onUpdated();
  }

  async function handleUpdatePlaces() {
    if (newMaxParticipants < booked) {
      setPlacesError(`Impossible : ${booked} réservation(s) confirmée(s) sur ce créneau.`);
      return;
    }
    setPlacesLoading(true);
    setPlacesError("");
    const res = await fetch(`/api/admin/slots/${slot.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxParticipants: newMaxParticipants }),
    });
    setPlacesLoading(false);
    if (res.ok) {
      setEditingPlaces(false);
      onUpdated();
    } else {
      setPlacesError("Une erreur est survenue.");
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer définitivement ce créneau ? (sans remboursement)")) return;
    await fetch(`/api/admin/slots/${slot.id}`, { method: "DELETE" });
    onUpdated();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slot.serviceType.color ?? "#b5552a" }} />
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">{slot.serviceType.name}</h2>
              <p className="text-sm text-muted-foreground capitalize">
                {formatDate(slot.startTime, "EEEE d MMMM yyyy")} · {formatTime(slot.startTime)} → {formatTime(slot.endTime)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Statut */}
          {slot.isCancelled && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <p className="text-sm font-medium text-destructive">Ce créneau est annulé</p>
              {slot.cancelReason && <p className="text-xs text-destructive/70 mt-1">{slot.cancelReason}</p>}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-foreground">{booked}/{slot.maxParticipants}</p>
              <p className="text-xs text-muted-foreground mt-1">Réservations</p>
              {!slot.isCancelled && (
                editingPlaces ? (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 justify-center">
                      <button onClick={() => setNewMaxParticipants(Math.max(booked, newMaxParticipants - 1))} className="w-6 h-6 bg-secondary border border-border rounded text-sm font-bold hover:bg-muted">−</button>
                      <input
                        type="number"
                        value={newMaxParticipants}
                        min={booked}
                        onChange={(e) => setNewMaxParticipants(parseInt(e.target.value) || booked)}
                        className="w-12 text-center border border-input rounded px-1 py-0.5 text-sm bg-background"
                      />
                      <button onClick={() => setNewMaxParticipants(newMaxParticipants + 1)} className="w-6 h-6 bg-secondary border border-border rounded text-sm font-bold hover:bg-muted">+</button>
                    </div>
                    {placesError && <p className="text-xs text-destructive">{placesError}</p>}
                    <div className="flex gap-1 justify-center">
                      <button onClick={handleUpdatePlaces} disabled={placesLoading} className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded hover:bg-primary/90 disabled:opacity-50">
                        {placesLoading ? "..." : "OK"}
                      </button>
                      <button onClick={() => { setEditingPlaces(false); setNewMaxParticipants(slot.maxParticipants); setPlacesError(""); }} className="text-xs border border-border px-2 py-0.5 rounded hover:bg-secondary">
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setEditingPlaces(true)} className="mt-1 text-xs text-primary hover:underline">
                    Modifier
                  </button>
                )
              )}
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-foreground">{slot.waitlists.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Liste d'attente</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-primary">{formatPrice(revenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">Revenus</p>
            </div>
          </div>

          {slot.notes && (
            <div className="bg-secondary/30 rounded-lg p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Note : </span>{slot.notes}
            </div>
          )}

          {/* Réservations */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participants ({booked})
            </h3>
            {slot.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune réservation</p>
            ) : (
              <div className="space-y-2">
                {slot.bookings.map((booking) => (
                  <div key={booking.id} className={`border rounded-xl p-4 ${booking.status !== "CONFIRMED" ? "opacity-50" : "border-border"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {booking.user.firstName} {booking.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{booking.user.email}</p>
                        {booking.participants.length > 1 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {booking.participants.filter((p) => !p.isMainBooker).map((p) => (
                              <span key={p.id} className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                                +{p.firstName} {p.lastName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                          {PAYMENT_LABELS[booking.paymentMethod] ?? booking.paymentMethod}
                        </span>
                        {Number(booking.amountPaid) > 0 && (
                          <p className="text-xs text-primary font-medium mt-1">
                            {formatPrice(Number(booking.amountPaid))}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Liste d'attente */}
          {slot.waitlists.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Liste d'attente ({slot.waitlists.length})</h3>
              <div className="space-y-1.5">
                {slot.waitlists.map((w, i) => (
                  <div key={w.id} className="flex items-center gap-3 text-sm text-muted-foreground py-1.5 border-b border-border last:border-0">
                    <span className="w-5 text-center text-xs font-medium text-foreground">{i + 1}</span>
                    <span>{w.user.firstName} {w.user.lastName}</span>
                    <span className="text-xs">{w.user.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!slot.isCancelled && (
            <div className="border-t border-border pt-5">
              <h3 className="font-semibold text-foreground mb-4">Actions</h3>

              {!showCancelConfirm ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-2 border border-destructive/30 text-destructive px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Annuler ce créneau
                  </button>
                </div>
              ) : (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-destructive">
                    Annuler ce créneau et notifier les {booked} participant{booked > 1 ? "s" : ""} ?
                  </p>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Raison (optionnel)</label>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Ex: Indisponibilité exceptionnelle"
                      className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {booked > 0 && (
                    <div>
                      <label className="block text-xs text-muted-foreground mb-2">Remboursement des participants</label>
                      <div className="flex gap-3">
                        {[
                          { value: "credit", label: "Avoir en compte" },
                          { value: "refund", label: "Remboursement Stripe" },
                        ].map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="radio"
                              value={opt.value}
                              checked={cancelAction === opt.value}
                              onChange={() => setCancelAction(opt.value as "credit" | "refund")}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 border border-border py-2 rounded-lg text-sm hover:bg-secondary"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex-1 bg-destructive text-white py-2 rounded-lg text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirmer l'annulation
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
