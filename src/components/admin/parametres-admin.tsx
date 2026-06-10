"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  type: string;
  price: number;
  durationMinutes: number;
  maxParticipants: number;
  allowCarnet: boolean;
  allowMultiPerson: boolean;
  isActive: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  totalCourses: number;
  cycleType: string;
  isActive: boolean;
}

interface Props {
  settings: Record<string, string>;
  services: Service[];
  plans: Plan[];
}

const SERVICE_TYPES = [
  { value: "COLLECTIVE_POTTERY", label: "Poterie — Cours collectif" },
  { value: "PRIVATE_POTTERY", label: "Poterie — Cours particulier" },
  { value: "PRIVATE_GROUP_POTTERY", label: "Poterie — Cours groupe" },
  { value: "PAINTING", label: "Peinture" },
  { value: "BIRTHDAY", label: "Événement / Anniversaire" },
  { value: "COURS", label: "Cours" },
];

function AbonnementsTab({ plans: initPlans }: { plans: Plan[] }) {
  const [plans, setPlans] = useState(initPlans);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const emptyPlan = { name: "", description: "", coursesPerCycle: "1", cycleType: "ANNUAL", totalCourses: "30", price: "" };
  const [newPlan, setNewPlan] = useState(emptyPlan);

  async function addPlan() {
    if (!newPlan.name || !newPlan.price) return;
    setSaving(true);
    const res = await fetch("/api/admin/subscription-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newPlan, price: parseFloat(newPlan.price), coursesPerCycle: parseInt(newPlan.coursesPerCycle), totalCourses: parseInt(newPlan.totalCourses) }),
    });
    const data = await res.json();
    if (res.ok) { setPlans([...plans, data]); setNewPlan(emptyPlan); }
    setSaving(false);
  }

  async function savePlan(id: string) {
    const res = await fetch("/api/admin/subscription-plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editData, price: parseFloat(editData.price ?? "0"), coursesPerCycle: parseInt(editData.coursesPerCycle ?? "1"), totalCourses: parseInt(editData.totalCourses ?? "30") }),
    });
    const data = await res.json();
    if (res.ok) { setPlans(plans.map((p) => p.id === id ? { ...p, ...data } : p)); setEditId(null); }
  }

  async function togglePlan(id: string, isActive: boolean) {
    await fetch("/api/admin/subscription-plans", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive }) });
    setPlans(plans.map((p) => p.id === id ? { ...p, isActive } : p));
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-medium text-foreground mb-4">Ajouter un plan d'abonnement</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input type="text" placeholder="Nom du plan *" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="text" placeholder="Description" value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="number" placeholder="Prix (€) *" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })} step="0.5" className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="number" placeholder="Cours par cycle" value={newPlan.coursesPerCycle} onChange={(e) => setNewPlan({ ...newPlan, coursesPerCycle: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="number" placeholder="Total cours / an" value={newPlan.totalCourses} onChange={(e) => setNewPlan({ ...newPlan, totalCourses: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <select value={newPlan.cycleType} onChange={(e) => setNewPlan({ ...newPlan, cycleType: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="ANNUAL">Annuel</option>
            <option value="MONTHLY">Mensuel</option>
            <option value="SEMESTER">Semestriel</option>
          </select>
        </div>
        <button onClick={addPlan} disabled={saving || !newPlan.name || !newPlan.price} className="mt-3 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ajouter
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cycle</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cours</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Prix</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actif</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {plans.map((p) => (
              <tr key={p.id} className={!p.isActive ? "opacity-50" : ""}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {editId === p.id ? <input value={editData.name ?? p.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="border border-input rounded px-2 py-1 text-sm bg-background w-full" /> : p.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                  {editId === p.id ? (
                    <select value={editData.cycleType ?? p.cycleType} onChange={(e) => setEditData({ ...editData, cycleType: e.target.value })} className="border border-input rounded px-2 py-1 text-sm bg-background">
                      <option value="ANNUAL">Annuel</option>
                      <option value="MONTHLY">Mensuel</option>
                      <option value="SEMESTER">Semestriel</option>
                    </select>
                  ) : p.cycleType}
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground hidden sm:table-cell">
                  {editId === p.id ? <input type="number" value={editData.totalCourses ?? String(p.totalCourses)} onChange={(e) => setEditData({ ...editData, totalCourses: e.target.value })} className="border border-input rounded px-2 py-1 text-sm bg-background w-16 text-center" /> : p.totalCourses}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-primary">
                  {editId === p.id ? <input type="number" value={editData.price ?? String(p.price)} onChange={(e) => setEditData({ ...editData, price: e.target.value })} step="0.5" className="border border-input rounded px-2 py-1 text-sm bg-background w-20 text-right" /> : formatPrice(p.price)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => togglePlan(p.id, !p.isActive)} className={`w-8 h-4 rounded-full transition-colors ${p.isActive ? "bg-green-500" : "bg-muted"}`}>
                    <div className={`w-3 h-3 bg-white rounded-full mx-auto transition-transform ${p.isActive ? "translate-x-1" : "-translate-x-1"}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {editId === p.id ? (
                      <>
                        <button onClick={() => savePlan(p.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <button onClick={() => { setEditId(p.id); setEditData({ name: p.name, cycleType: p.cycleType, totalCourses: String(p.totalCourses), coursesPerCycle: String(p.coursesPerCycle), price: String(p.price) }); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded"><Pencil className="w-4 h-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Aucun plan d'abonnement créé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ParametresAdmin({ settings, services: initServices, plans: initPlans }: Props) {
  const [tab, setTab] = useState<"services" | "abonnements" | "general">("services");
  const [services, setServices] = useState(initServices);
  const [plans, setPlans] = useState(initPlans);
  const [appSettings, setAppSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  // Formulaire nouveau service
  const emptyService = { name: "", type: "COLLECTIVE_POTTERY", price: "", durationMinutes: "90", maxParticipants: "10", allowCarnet: false, allowMultiPerson: false };
  const [newService, setNewService] = useState(emptyService);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [editService, setEditService] = useState<Record<string, string>>({});

  async function addService() {
    if (!newService.name || !newService.price) return;
    setSaving(true);
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newService, price: parseFloat(newService.price), durationMinutes: parseInt(newService.durationMinutes), maxParticipants: parseInt(newService.maxParticipants) }),
    });
    const data = await res.json();
    if (res.ok) { setServices([...services, { ...data, price: Number(data.price) }]); setNewService(emptyService); }
    setSaving(false);
  }

  async function saveService(id: string) {
    const res = await fetch("/api/admin/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editService, price: parseFloat(String(editService.price ?? 0)), durationMinutes: parseInt(String(editService.durationMinutes ?? 90)), maxParticipants: parseInt(String(editService.maxParticipants ?? 10)) }),
    });
    const data = await res.json();
    if (res.ok) { setServices(services.map((s) => s.id === id ? { ...s, ...data, price: Number(data.price) } : s)); setEditServiceId(null); }
  }

  async function toggleService(id: string, isActive: boolean) {
    await fetch("/api/admin/services", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive }) });
    setServices(services.map((s) => s.id === id ? { ...s, isActive } : s));
  }

  async function saveSetting(key: string, value: string) {
    await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
    setAppSettings({ ...appSettings, [key]: value });
  }

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-secondary/50 p-1 rounded-lg w-fit">
        {(["services", "abonnements", "general"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "services" ? "Services & tarifs" : t === "abonnements" ? "Abonnements" : "Général"}
          </button>
        ))}
      </div>

      {tab === "services" && (
        <div className="space-y-6">
          {/* Nouveau service */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-medium text-foreground mb-4">Ajouter un service</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Nom du service *</label>
                <input type="text" placeholder="Ex : Cours collectif débutant" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Type de service *</label>
                <select value={newService.type} onChange={(e) => setNewService({ ...newService, type: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Prix (€) *</label>
                <input type="number" placeholder="Ex : 15" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} step="0.5" className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Durée (minutes)</label>
                <input type="number" placeholder="Ex : 90" value={newService.durationMinutes} onChange={(e) => setNewService({ ...newService, durationMinutes: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Capacité max (personnes)</label>
                <input type="number" placeholder="Ex : 10" value={newService.maxParticipants} onChange={(e) => setNewService({ ...newService, maxParticipants: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={newService.allowCarnet} onChange={(e) => setNewService({ ...newService, allowCarnet: e.target.checked })} className="rounded" />
                  Carnet
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={newService.allowMultiPerson} onChange={(e) => setNewService({ ...newService, allowMultiPerson: e.target.checked })} className="rounded" />
                  Multi-personnes
                </label>
              </div>
            </div>
            <button onClick={addService} disabled={saving || !newService.name || !newService.price} className="mt-3 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ajouter
            </button>
          </div>

          {/* Liste services */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Prix</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Durée</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actif</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {services.map((s) => (
                  <tr key={s.id} className={!s.isActive ? "opacity-50" : ""}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {editServiceId === s.id ? <input value={String(editService.name ?? s.name)} onChange={(e) => setEditService({ ...editService, name: e.target.value })} className="border border-input rounded px-2 py-1 text-sm bg-background w-full" /> : s.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                      {editServiceId === s.id ? (
                        <select value={editService.type ?? s.type} onChange={(e) => setEditService({ ...editService, type: e.target.value })} className="border border-input rounded px-2 py-1 text-sm bg-background">
                          {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      ) : (
                        SERVICE_TYPES.find((t) => t.value === s.type)?.label ?? s.type
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {editServiceId === s.id ? <input type="number" value={editService.price ?? String(s.price)} onChange={(e) => setEditService({ ...editService, price: e.target.value })} step="0.5" className="border border-input rounded px-2 py-1 text-sm bg-background w-20 text-right" /> : formatPrice(s.price)}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground hidden sm:table-cell">
                      {editServiceId === s.id ? <input type="number" value={editService.durationMinutes ?? String(s.durationMinutes)} onChange={(e) => setEditService({ ...editService, durationMinutes: e.target.value })} className="border border-input rounded px-2 py-1 text-sm bg-background w-16 text-center" /> : `${s.durationMinutes} min`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleService(s.id, !s.isActive)} className={`w-8 h-4 rounded-full transition-colors ${s.isActive ? "bg-green-500" : "bg-muted"}`}>
                        <div className={`w-3 h-3 bg-white rounded-full mx-auto transition-transform ${s.isActive ? "translate-x-1" : "-translate-x-1"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {editServiceId === s.id ? (
                          <>
                            <button onClick={() => saveService(s.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditServiceId(null)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <button onClick={() => { setEditServiceId(s.id); setEditService({ name: s.name, price: String(s.price), durationMinutes: String(s.durationMinutes), maxParticipants: String(s.maxParticipants) } as Record<string, string>); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded"><Pencil className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "general" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-5 max-w-lg">
          <h3 className="font-semibold text-foreground">Paramètres généraux</h3>
          {[
            { key: "booking_advance_days", label: "Délai de réservation (jours)", hint: "Nombre de jours en avance maximum" },
            { key: "cancellation_deadline_hours", label: "Délai d'annulation (heures)", hint: "Délai minimum avant annulation gratuite" },
          ].map((setting) => (
            <div key={setting.key}>
              <label className="block text-sm font-medium text-foreground mb-1">{setting.label}</label>
              <p className="text-xs text-muted-foreground mb-2">{setting.hint}</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={appSettings[setting.key] ?? ""}
                  onChange={(e) => setAppSettings({ ...appSettings, [setting.key]: e.target.value })}
                  className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-24"
                />
                <button onClick={() => saveSetting(setting.key, appSettings[setting.key])} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                  Sauvegarder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "abonnements" && (
        <AbonnementsTab plans={plans} />
      )}
    </div>
  );
}
