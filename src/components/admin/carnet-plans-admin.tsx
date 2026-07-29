"use client";

import { useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Pencil, Check, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CarnetPlan {
  id: string;
  name: string;
  description?: string | null;
  numberOfSessions: number;
  price: number;
  validityMonths: number;
  isActive: boolean;
  serviceType: { id: string; name: string };
}

interface ServiceType {
  id: string;
  name: string;
}

interface EditState {
  name: string;
  description: string;
  numberOfSessions: number;
  price: string;
  validityMonths: number;
}

export function CarnetPlansAdmin({
  initialPlans,
  serviceTypes,
}: {
  initialPlans: CarnetPlan[];
  serviceTypes: ServiceType[];
}) {
  const [plans, setPlans] = useState(initialPlans);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: "", description: "", numberOfSessions: 0, price: "", validityMonths: 12 });
  const [editLoading, setEditLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    serviceTypeId: serviceTypes[0]?.id ?? "",
    numberOfSessions: 10,
    price: "",
    validityMonths: 12,
  });

  function startEdit(plan: CarnetPlan) {
    setEditingId(plan.id);
    setEditState({
      name: plan.name,
      description: plan.description ?? "",
      numberOfSessions: plan.numberOfSessions,
      price: String(plan.price),
      validityMonths: plan.validityMonths,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(planId: string) {
    setEditLoading(true);
    const res = await fetch(`/api/admin/carnet-plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editState.name,
        description: editState.description,
        numberOfSessions: Number(editState.numberOfSessions),
        price: parseFloat(editState.price),
        validityMonths: Number(editState.validityMonths),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setPlans(plans.map((p) => p.id === planId ? { ...p, ...data, serviceType: p.serviceType } : p));
      setEditingId(null);
    }
    setEditLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/carnet-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price),
        numberOfSessions: Number(form.numberOfSessions),
        validityMonths: Number(form.validityMonths),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Erreur"); setLoading(false); return; }
    const svc = serviceTypes.find((s) => s.id === data.serviceTypeId);
    setPlans([{ ...data, serviceType: svc ?? { id: data.serviceTypeId, name: "" } }, ...plans]);
    setShowForm(false);
    setForm({ name: "", description: "", serviceTypeId: serviceTypes[0]?.id ?? "", numberOfSessions: 10, price: "", validityMonths: 12 });
    setLoading(false);
  }

  async function toggleActive(plan: CarnetPlan) {
    const res = await fetch(`/api/admin/carnet-plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive }),
    });
    if (res.ok) setPlans(plans.map((p) => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce plan carnet ?")) return;
    const res = await fetch(`/api/admin/carnet-plans/${id}`, { method: "DELETE" });
    if (res.ok) setPlans(plans.filter((p) => p.id !== id));
  }

  if (serviceTypes.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <p className="text-amber-800 text-sm">Aucun service avec l'option "Carnet autorisé" activée. Activez cette option dans la gestion des services d'abord.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau plan carnet
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Nouveau plan carnet</h2>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nom</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Ex: Carnet 10 cours poterie"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Idéal pour débuter en poterie"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Service</label>
              <select
                value={form.serviceTypeId}
                onChange={(e) => setForm({ ...form, serviceTypeId: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
              >
                {serviceTypes.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nombre de cours</label>
              <input
                type="number"
                min={1}
                value={form.numberOfSessions}
                onChange={(e) => setForm({ ...form, numberOfSessions: parseInt(e.target.value) })}
                required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Prix (€)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                placeholder="0.00"
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Validité (mois)</label>
              <input
                type="number"
                min={1}
                value={form.validityMonths}
                onChange={(e) => setForm({ ...form, validityMonths: parseInt(e.target.value) })}
                required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? "Création..." : "Créer le plan"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border">
              Annuler
            </button>
          </div>
        </form>
      )}

      {plans.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-muted-foreground">Aucun plan carnet créé pour l'instant.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Service</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cours</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prix</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Validité</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plans.map((plan) =>
                editingId === plan.id ? (
                  <tr key={plan.id} className="bg-primary/5">
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editState.name}
                        onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                        className="w-full border border-input rounded-lg px-2 py-1.5 text-sm bg-background"
                      />
                    </td>
                    <td className="px-4 py-2 hidden lg:table-cell">
                      <input
                        type="text"
                        value={editState.description}
                        onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                        placeholder="Description (optionnel)"
                        className="w-full border border-input rounded-lg px-2 py-1.5 text-sm bg-background"
                      />
                    </td>
                    <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell text-xs">{plan.serviceType.name}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={1}
                        value={editState.numberOfSessions}
                        onChange={(e) => setEditState({ ...editState, numberOfSessions: parseInt(e.target.value) })}
                        className="w-20 border border-input rounded-lg px-2 py-1.5 text-sm bg-background"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={editState.price}
                        onChange={(e) => setEditState({ ...editState, price: e.target.value })}
                        className="w-24 border border-input rounded-lg px-2 py-1.5 text-sm bg-background"
                      />
                    </td>
                    <td className="px-4 py-2 hidden sm:table-cell">
                      <input
                        type="number"
                        min={1}
                        value={editState.validityMonths}
                        onChange={(e) => setEditState({ ...editState, validityMonths: parseInt(e.target.value) })}
                        className="w-20 border border-input rounded-lg px-2 py-1.5 text-sm bg-background"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.isActive ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                        {plan.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleSaveEdit(plan.id)}
                          disabled={editLoading}
                          className="text-green-600 hover:text-green-700 disabled:opacity-50"
                          title="Enregistrer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground" title="Annuler">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={plan.id} className={!plan.isActive ? "opacity-50" : ""}>
                    <td className="px-4 py-3 font-medium text-foreground">{plan.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{plan.description ?? <span className="italic">—</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{plan.serviceType.name}</td>
                    <td className="px-4 py-3 text-foreground">{plan.numberOfSessions}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{formatPrice(plan.price)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{plan.validityMonths} mois</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.isActive ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                        {plan.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => startEdit(plan)} className="text-muted-foreground hover:text-foreground transition-colors" title="Modifier">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleActive(plan)} title={plan.isActive ? "Désactiver" : "Activer"} className="text-muted-foreground hover:text-foreground transition-colors">
                          {plan.isActive ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => handleDelete(plan.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
