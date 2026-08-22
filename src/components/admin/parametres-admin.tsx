"use client";

import React, { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  type: string;
  pricingType: string;
  price: number;
  durationMinutes: number;
  maxParticipants: number;
  allowCarnet: boolean;
  allowMultiPerson: boolean;
  isActive: boolean;
  description?: string | null;
  shortDescription?: string | null;
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
  { value: "BIRTHDAY", label: "Événement" },
  { value: "COURS", label: "Cours" },
];

function AbonnementsTab({ plans: initPlans }: { plans: Plan[] }) {
  const [plans, setPlans] = useState(initPlans);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});

  async function deletePlan(id: string, name: string) {
    if (!confirm(`Supprimer le plan "${name}" ? Cette action est irréversible.`)) return;
    const res = await fetch("/api/admin/subscription-plans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setPlans(plans.filter((p) => p.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erreur lors de la suppression.");
    }
  }
  const emptyPlan = { name: "", description: "", cycleType: "annuel", totalCourses: "30", price: "" };
  const [newPlan, setNewPlan] = useState(emptyPlan);

  async function addPlan() {
    if (!newPlan.name || !newPlan.price) return;
    setSaving(true);
    const res = await fetch("/api/admin/subscription-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newPlan, price: parseFloat(newPlan.price), totalCourses: parseInt(newPlan.totalCourses) }),
    });
    const data = await res.json();
    if (res.ok) { setPlans([...plans, data]); setNewPlan(emptyPlan); }
    setSaving(false);
  }

  async function savePlan(id: string) {
    const res = await fetch("/api/admin/subscription-plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editData, price: parseFloat(editData.price ?? "0"), totalCourses: parseInt(editData.totalCourses ?? "30") }),
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Nom du plan *</label>
            <input type="text" placeholder="Ex : Abonnement annuel" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input type="text" placeholder="Ex : 1 cours par semaine" value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Prix (€) *</label>
            <input type="number" placeholder="Ex : 200" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })} step="0.5" className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Total de cours inclus</label>
            <input type="number" placeholder="Ex : 30" value={newPlan.totalCourses} onChange={(e) => setNewPlan({ ...newPlan, totalCourses: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Type de cycle</label>
            <select value={newPlan.cycleType} onChange={(e) => setNewPlan({ ...newPlan, cycleType: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="annuel">Annuel</option>
              <option value="mensuel">Mensuel</option>
              <option value="semestriel">Semestriel</option>
            </select>
          </div>
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
                      <option value="annuel">Annuel</option>
                      <option value="mensuel">Mensuel</option>
                      <option value="semestriel">Semestriel</option>
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
                      <>
                        <button onClick={() => { setEditId(p.id); setEditData({ name: p.name, cycleType: p.cycleType, totalCourses: String(p.totalCourses), price: String(p.price) }); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deletePlan(p.id, p.name)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded"><Trash2 className="w-4 h-4" /></button>
                      </>
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
  const emptyService = { name: "", type: "COLLECTIVE_POTTERY", pricingType: "PER_PERSON", price: "", durationMinutes: "90", maxParticipants: "10", allowCarnet: false, allowMultiPerson: false, shortDescription: "", description: "" };
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
      body: JSON.stringify({ id, ...editService, price: parseFloat(String(editService.price ?? 0)), durationMinutes: parseInt(String(editService.durationMinutes ?? 90)), maxParticipants: parseInt(String(editService.maxParticipants ?? 10)), allowMultiPerson: editService.allowMultiPerson === "true", allowCarnet: editService.allowCarnet === "true" }),
    });
    const data = await res.json();
    if (res.ok) { setServices(services.map((s) => s.id === id ? { ...s, ...data, price: Number(data.price) } : s)); setEditServiceId(null); }
  }

  async function deleteService(id: string, name: string) {
    if (!confirm(`Supprimer le service "${name}" ? Cette action est irréversible.`)) return;
    const res = await fetch("/api/admin/services", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setServices(services.filter((s) => s.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erreur lors de la suppression.");
    }
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
                <label className="text-xs font-medium text-muted-foreground">Tarification *</label>
                <select value={newService.pricingType} onChange={(e) => setNewService({ ...newService, pricingType: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="PER_PERSON">Collectif (par personne)</option>
                  <option value="FIXED">Groupe / Personnel (forfait)</option>
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
              <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
                <label className="text-xs font-medium text-muted-foreground">Description courte</label>
                <input type="text" placeholder="Ex : Initiez-vous à la poterie en groupe" value={newService.shortDescription} onChange={(e) => setNewService({ ...newService, shortDescription: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
                <label className="text-xs font-medium text-muted-foreground">Description longue</label>
                <textarea rows={3} placeholder="Description complète du service..." value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tarification</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Prix</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Durée</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actif</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {services.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr className={!s.isActive ? "opacity-50" : ""}>
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
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {editServiceId === s.id ? (
                          <select value={editService.pricingType ?? s.pricingType} onChange={(e) => setEditService({ ...editService, pricingType: e.target.value })} className="border border-input rounded px-2 py-1 text-sm bg-background">
                            <option value="PER_PERSON">Collectif (par pers.)</option>
                            <option value="FIXED">Groupe / Personnel (forfait)</option>
                          </select>
                        ) : (
                          s.pricingType === "FIXED" ? "Forfait" : "Par pers."
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
                            <>
                              <button onClick={() => { setEditServiceId(s.id); setEditService({ name: s.name, type: s.type, pricingType: s.pricingType ?? "PER_PERSON", price: String(s.price), durationMinutes: String(s.durationMinutes), maxParticipants: String(s.maxParticipants), shortDescription: s.shortDescription ?? "", description: s.description ?? "", allowMultiPerson: String(s.allowMultiPerson), allowCarnet: String(s.allowCarnet) } as Record<string, string>); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => deleteService(s.id, s.name)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {editServiceId === s.id && (
                      <tr className="bg-secondary/30">
                        <td colSpan={7} className="px-4 pb-3 pt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-muted-foreground">Capacité max (personnes)</label>
                              <input type="number" min={1} value={editService.maxParticipants ?? ""} onChange={(e) => setEditService({ ...editService, maxParticipants: e.target.value })} className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-muted-foreground">Description courte</label>
                              <input type="text" placeholder="Ex : Initiez-vous à la poterie en groupe" value={editService.shortDescription ?? ""} onChange={(e) => setEditService({ ...editService, shortDescription: e.target.value })} className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-muted-foreground">Description longue</label>
                              <textarea rows={2} placeholder="Description complète du service..." value={editService.description ?? ""} onChange={(e) => setEditService({ ...editService, description: e.target.value })} className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                            </div>
                          </div>
                          <div className="flex gap-6 pt-1">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="checkbox" checked={editService.allowMultiPerson === "true"} onChange={(e) => setEditService({ ...editService, allowMultiPerson: String(e.target.checked) })} className="rounded" />
                              <span className="text-muted-foreground">Réservation multi-personnes</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="checkbox" checked={editService.allowCarnet === "true"} onChange={(e) => setEditService({ ...editService, allowCarnet: String(e.target.checked) })} className="rounded" />
                              <span className="text-muted-foreground">Carnet de cours accepté</span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
