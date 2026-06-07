"use client";

import { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  maxParticipants: number;
  color: string | null;
}

interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Props {
  services: Service[];
  holidays: Holiday[];
  onClose: () => void;
  onCreated: () => void;
}

const RECURRENCE_TYPES = [
  { value: "none", label: "Aucune récurrence" },
  { value: "weekly", label: "Toutes les semaines" },
  { value: "biweekly", label: "Toutes les 2 semaines" },
  { value: "monthly", label: "Tous les mois" },
];

export function SlotFormModal({ services, holidays, onClose, onCreated }: Props) {
  const defaultService = services[0];
  const today = new Date();
  today.setHours(14, 0, 0, 0);
  const defaultEnd = new Date(today);
  defaultEnd.setMinutes(defaultEnd.getMinutes() + (defaultService?.durationMinutes ?? 90));

  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    serviceTypeId: defaultService?.id ?? "",
    startTime: toLocalInput(today),
    endTime: toLocalInput(defaultEnd),
    maxParticipants: defaultService?.maxParticipants ?? 10,
    notes: "",
    recurrenceType: "none",
    recurrenceCount: 8,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  function isHoliday(dateStr: string): string | null {
    const d = new Date(dateStr);
    const h = holidays.find((h) => d >= new Date(h.startDate) && d <= new Date(h.endDate));
    return h ? h.name : null;
  }

  function onServiceChange(serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    const start = new Date(form.startTime);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + service.durationMinutes);
    setForm({
      ...form,
      serviceTypeId: serviceId,
      endTime: toLocalInput(end),
      maxParticipants: service.maxParticipants,
    });
  }

  function onStartChange(value: string) {
    const service = services.find((s) => s.id === form.serviceTypeId);
    const start = new Date(value);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + (service?.durationMinutes ?? 90));
    setForm({ ...form, startTime: value, endTime: toLocalInput(end) });
  }

  // Aperçu des dates générées
  function generatePreviewDates(): string[] {
    if (form.recurrenceType === "none") return [form.startTime];
    const dates: string[] = [];
    const start = new Date(form.startTime);
    for (let i = 0; i < form.recurrenceCount; i++) {
      const d = new Date(start);
      if (form.recurrenceType === "weekly") d.setDate(d.getDate() + i * 7);
      else if (form.recurrenceType === "biweekly") d.setDate(d.getDate() + i * 14);
      else if (form.recurrenceType === "monthly") d.setMonth(d.getMonth() + i);
      dates.push(d.toISOString());
    }
    return dates;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceTypeId: form.serviceTypeId,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        maxParticipants: form.maxParticipants,
        notes: form.notes || undefined,
        recurrence: {
          type: form.recurrenceType,
          count: form.recurrenceCount,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur lors de la création.");
      setLoading(false);
      return;
    }

    onCreated();
  }

  const previewDates = generatePreviewDates();
  const holidayWarnings = previewDates.filter((d) => isHoliday(d));
  const holidayDatesInPreview = previewDates.map((d) => ({ date: d, holiday: isHoliday(d) })).filter((x) => x.holiday);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-heading text-xl font-bold text-foreground">Nouveau créneau</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Service *</label>
            <select
              value={form.serviceTypeId}
              onChange={(e) => onServiceChange(e.target.value)}
              required
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Date & heures */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Début *</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => onStartChange(e.target.value)}
                required
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Fin *</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Capacité */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Capacité maximum</label>
            <input
              type="number"
              value={form.maxParticipants}
              onChange={(e) => setForm({ ...form, maxParticipants: parseInt(e.target.value) })}
              min={1}
              max={50}
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Récurrence */}
          <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Récurrence</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Type</label>
                <select
                  value={form.recurrenceType}
                  onChange={(e) => setForm({ ...form, recurrenceType: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {RECURRENCE_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {form.recurrenceType !== "none" && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Nombre de répétitions</label>
                  <input
                    type="number"
                    value={form.recurrenceCount}
                    onChange={(e) => setForm({ ...form, recurrenceCount: parseInt(e.target.value) })}
                    min={2}
                    max={52}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </div>

            {/* Bouton aperçu */}
            {form.recurrenceType !== "none" && (
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className="text-xs text-primary hover:underline"
              >
                {preview ? "Masquer" : "Voir"} les {form.recurrenceCount} dates générées
              </button>
            )}

            {preview && form.recurrenceType !== "none" && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {previewDates.map((d, i) => {
                  const holiday = isHoliday(d);
                  return (
                    <div key={i} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${holiday ? "bg-amber-50 text-amber-700" : "text-muted-foreground"}`}>
                      <span className="w-4 text-center">{i + 1}.</span>
                      <span className="capitalize">{new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                      {holiday && <span className="text-amber-600">⚠ {holiday}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Avertissement vacances */}
          {holidayDatesInPreview.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {holidayDatesInPreview.length} créneau{holidayDatesInPreview.length > 1 ? "x" : ""} tombe{holidayDatesInPreview.length > 1 ? "nt" : ""} pendant les vacances scolaires.
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Ces créneaux seront quand même créés — vous pouvez les supprimer manuellement si nécessaire.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Notes <span className="text-muted-foreground font-normal">(optionnel)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Informations spéciales pour ce créneau..."
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {form.recurrenceType !== "none"
                ? `Créer ${form.recurrenceCount} créneaux`
                : "Créer le créneau"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
