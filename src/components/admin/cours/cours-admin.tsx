"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";
import { Plus, CalendarX, Users, ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";
import { SlotFormModal } from "./slot-form-modal";
import { SlotDetailModal } from "./slot-detail-modal";

interface Service {
  id: string;
  name: string;
  price: number;
  color: string | null;
  durationMinutes: number;
  maxParticipants: number;
}

interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface SlotBooking {
  id: string;
  status: string;
  paymentMethod: string;
  amountPaid: number | null;
  user: { firstName: string | null; lastName: string | null; email: string };
  participants: { id: string; firstName: string; lastName: string; isMainBooker: boolean }[];
}

interface Slot {
  id: string;
  serviceTypeId: string;
  serviceType: Service;
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

interface GroupedSlots {
  [week: string]: Slot[];
}

export function CoursAdmin({ services, holidays }: { services: Service[]; holidays: Holiday[] }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [filterService, setFilterService] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    const res = await fetch(
      `/api/admin/slots?from=${now.toISOString()}&to=${threeMonthsLater.toISOString()}`
    );
    const data = await res.json();
    setSlots(data);
    setLoading(false);

    // Auto-expand current week
    if (data.length > 0) {
      const firstWeek = getWeekLabel(new Date(data[0].startTime));
      setExpandedWeeks(new Set([firstWeek]));
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  function getWeekLabel(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }

  const filtered = slots.filter((s) => {
    if (filterService !== "all" && s.serviceTypeId !== filterService) return false;
    if (filterStatus === "active" && s.isCancelled) return false;
    if (filterStatus === "cancelled" && !s.isCancelled) return false;
    return true;
  });

  const grouped = filtered.reduce<GroupedSlots>((acc, slot) => {
    const week = getWeekLabel(new Date(slot.startTime));
    if (!acc[week]) acc[week] = [];
    acc[week].push(slot);
    return acc;
  }, {});

  function toggleWeek(week: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      next.has(week) ? next.delete(week) : next.add(week);
      return next;
    });
  }

  function isHolidayPeriod(date: string): boolean {
    const d = new Date(date);
    return holidays.some(
      (h) => d >= new Date(h.startDate) && d <= new Date(h.endDate)
    );
  }

  function getFillColor(booked: number, max: number): string {
    const pct = booked / max;
    if (pct >= 1) return "bg-red-500";
    if (pct >= 0.8) return "bg-orange-400";
    if (pct >= 0.5) return "bg-amber-400";
    return "bg-green-500";
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tous les services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="active">Actifs</option>
            <option value="cancelled">Annulés</option>
            <option value="all">Tous</option>
          </select>
          <button
            onClick={fetchSlots}
            className="p-2 border border-input rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouveau créneau
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total créneaux", value: filtered.filter((s) => !s.isCancelled).length },
          { label: "Complets", value: filtered.filter((s) => !s.isCancelled && s.bookings.length >= s.maxParticipants).length },
          { label: "En attente", value: filtered.reduce((sum, s) => sum + s.waitlists.length, 0) },
          { label: "Annulés", value: filtered.filter((s) => s.isCancelled).length },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Liste par semaine */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
          <CalendarX className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun créneau trouvé.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm text-primary hover:underline">
            Créer le premier créneau
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([week, weekSlots]) => {
            const isExpanded = expandedWeeks.has(week);
            const hasHoliday = weekSlots.some((s) => isHolidayPeriod(s.startTime));
            return (
              <div key={week} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleWeek(week)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">Semaine du {week}</span>
                    {hasHoliday && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Vacances scolaires
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {weekSlots.length} créneau{weekSlots.length > 1 ? "x" : ""}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {weekSlots.map((slot) => {
                      const booked = slot.bookings.length;
                      const pct = Math.round((booked / slot.maxParticipants) * 100);
                      return (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-secondary/20 transition-colors ${slot.isCancelled ? "opacity-50" : ""}`}
                        >
                          {/* Couleur service */}
                          <div
                            className="w-2 h-10 rounded-full shrink-0"
                            style={{ backgroundColor: slot.serviceType.color ?? "#b5552a" }}
                          />

                          {/* Date & heure */}
                          <div className="w-36 shrink-0">
                            <p className="text-sm font-medium text-foreground capitalize">
                              {new Date(slot.startTime).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(slot.startTime)} → {formatTime(slot.endTime)}
                            </p>
                          </div>

                          {/* Service */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{slot.serviceType.name}</p>
                            {slot.isCancelled && (
                              <span className="text-xs text-destructive">Annulé</span>
                            )}
                            {slot.notes && (
                              <p className="text-xs text-muted-foreground truncate">{slot.notes}</p>
                            )}
                          </div>

                          {/* Remplissage */}
                          <div className="w-28 shrink-0 hidden sm:block">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-secondary rounded-full">
                                <div
                                  className={`h-full rounded-full ${getFillColor(booked, slot.maxParticipants)}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {booked}/{slot.maxParticipants}
                              </span>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-2 shrink-0">
                            {slot.waitlists.length > 0 && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                {slot.waitlists.length} attente
                              </span>
                            )}
                            {booked >= slot.maxParticipants && !slot.isCancelled && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                Complet
                              </span>
                            )}
                            {isHolidayPeriod(slot.startTime) && (
                              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                                Vacances
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <SlotFormModal
          services={services}
          holidays={holidays}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); fetchSlots(); }}
        />
      )}
      {selectedSlot && (
        <SlotDetailModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onUpdated={() => { setSelectedSlot(null); fetchSlots(); }}
        />
      )}
    </div>
  );
}
