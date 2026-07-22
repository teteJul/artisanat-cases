"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Plus, Loader2, Trash2, RefreshCw } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  totalCourses: number;
  cycleType: string;
  price: number;
  isActive: boolean;
}

interface Subscription {
  id: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  remainingCredits: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  plan: Plan;
  user: { id: string; firstName: string | null; lastName: string | null; email: string };
}

interface Client {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Actif", cls: "bg-green-100 text-green-700" },
  PENDING: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  EXPIRED: { label: "Expiré", cls: "bg-secondary text-muted-foreground" },
  CANCELLED: { label: "Annulé", cls: "bg-red-100 text-red-600" },
};

const CYCLE_LABELS: Record<string, string> = {
  monthly: "1 mois", mensuel: "1 mois",
  quarterly: "3 mois", trimestriel: "3 mois",
  semestrial: "6 mois", semestriel: "6 mois",
  yearly: "1 an", annuel: "1 an",
};

export default function AdminAbonnementsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  // Formulaire création plan
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", description: "", totalCourses: 10, cycleType: "yearly", price: 0 });
  const [planSaving, setPlanSaving] = useState(false);

  // Formulaire création abonnement manuel
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState({ userId: "", planId: "", startDate: "", sendEmail: true });
  const [subSaving, setSubSaving] = useState(false);

  // Édition crédits
  const [editingCredits, setEditingCredits] = useState<{ id: string; value: number } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [filterStatus]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadSubscriptions(), loadPlans(), loadClients()]);
    setLoading(false);
  }

  async function loadSubscriptions() {
    const res = await fetch(`/api/admin/subscriptions?status=${filterStatus}`);
    if (res.ok) setSubscriptions(await res.json());
  }

  async function loadPlans() {
    const res = await fetch("/api/admin/subscription-plans");
    if (res.ok) setPlans(await res.json());
  }

  async function loadClients() {
    const res = await fetch("/api/admin/clients");
    if (res.ok) {
      setClients(await res.json());
    }
  }

  async function savePlan() {
    setPlanSaving(true);
    const res = await fetch("/api/admin/subscription-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...planForm, price: Number(planForm.price), totalCourses: Number(planForm.totalCourses) }),
    });
    if (res.ok) {
      await loadPlans();
      setShowPlanForm(false);
      setPlanForm({ name: "", description: "", totalCourses: 10, cycleType: "yearly", price: 0 });
    }
    setPlanSaving(false);
  }

  async function deletePlan(id: string) {
    if (!confirm("Désactiver cette formule ?")) return;
    await fetch("/api/admin/subscription-plans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadPlans();
  }

  async function createSubscription() {
    setSubSaving(true);
    const res = await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subForm),
    });
    if (res.ok) {
      await loadSubscriptions();
      setShowSubForm(false);
      setSubForm({ userId: "", planId: "", startDate: "", sendEmail: true });
    }
    setSubSaving(false);
  }

  async function cancelSubscription(id: string) {
    if (!confirm("Annuler cet abonnement et envoyer un email au client ?")) return;
    await fetch(`/api/admin/subscriptions/${id}`, { method: "DELETE" });
    loadSubscriptions();
  }

  async function saveCredits(id: string, remainingCredits: number) {
    await fetch(`/api/admin/subscriptions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remainingCredits }),
    });
    setEditingCredits(null);
    loadSubscriptions();
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Abonnements</h1>
        <p className="text-muted-foreground mt-1">Gérez les formules et les abonnements clients</p>
      </div>

      {/* ─── Formules ─── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground text-lg">Formules d'abonnement</h2>
          <button
            onClick={() => setShowPlanForm(!showPlanForm)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle formule
          </button>
        </div>

        {showPlanForm && (
          <div className="bg-card border border-border rounded-xl p-5 mb-4">
            <h3 className="font-medium text-foreground mb-4">Créer une formule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Nom *</label>
                <input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" placeholder="Ex: Formule mensuelle" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Prix (€) *</label>
                <input type="number" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Nombre de cours *</label>
                <input type="number" value={planForm.totalCourses} onChange={(e) => setPlanForm({ ...planForm, totalCourses: Number(e.target.value) })} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Durée *</label>
                <select value={planForm.cycleType} onChange={(e) => setPlanForm({ ...planForm, cycleType: e.target.value })} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                  <option value="monthly">Mensuel (1 mois)</option>
                  <option value="quarterly">Trimestriel (3 mois)</option>
                  <option value="semestrial">Semestriel (6 mois)</option>
                  <option value="yearly">Annuel (1 an)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Description</label>
                <textarea value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" rows={2} placeholder="Description visible par le client" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPlanForm(false)} className="border border-border px-4 py-2 rounded-lg text-sm hover:bg-secondary">Annuler</button>
              <button onClick={savePlan} disabled={planSaving || !planForm.name} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                {planSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer la formule
              </button>
            </div>
          </div>
        )}

        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 bg-card border border-dashed border-border rounded-xl">Aucune formule créée</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className={`bg-card border border-border rounded-xl p-5 ${!plan.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  <button onClick={() => deletePlan(plan.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {plan.description && <p className="text-xs text-muted-foreground mb-2">{plan.description}</p>}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-secondary px-2 py-0.5 rounded-full">{plan.totalCourses} cours</span>
                  <span className="bg-secondary px-2 py-0.5 rounded-full">{CYCLE_LABELS[plan.cycleType] ?? plan.cycleType}</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{formatPrice(plan.price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Abonnements clients ─── */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-foreground text-lg">Abonnements clients</h2>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
              {["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterStatus === s ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {STATUS_LABELS[s].label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSubForm(!showSubForm)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Attribuer
            </button>
          </div>
        </div>

        {showSubForm && (
          <div className="bg-card border border-border rounded-xl p-5 mb-4">
            <h3 className="font-medium text-foreground mb-4">Attribuer un abonnement manuellement</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Client *</label>
                <select value={subForm.userId} onChange={(e) => setSubForm({ ...subForm, userId: e.target.value })} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Formule *</label>
                <select value={subForm.planId} onChange={(e) => setSubForm({ ...subForm, planId: e.target.value })} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                  <option value="">Sélectionner une formule</option>
                  {plans.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Date de début (optionnel)</label>
                <input type="date" value={subForm.startDate} onChange={(e) => setSubForm({ ...subForm, startDate: e.target.value })} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="sendEmail" checked={subForm.sendEmail} onChange={(e) => setSubForm({ ...subForm, sendEmail: e.target.checked })} className="rounded" />
                <label htmlFor="sendEmail" className="text-sm text-foreground">Envoyer un email de confirmation au client</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSubForm(false)} className="border border-border px-4 py-2 rounded-lg text-sm hover:bg-secondary">Annuler</button>
              <button onClick={createSubscription} disabled={subSaving || !subForm.userId || !subForm.planId} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                {subSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Attribuer l'abonnement
              </button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {subscriptions.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Aucun abonnement {STATUS_LABELS[filterStatus]?.label.toLowerCase()}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Formule</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Période</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Crédits</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subscriptions.map((sub) => {
                    const { label, cls } = STATUS_LABELS[sub.status] ?? { label: sub.status, cls: "" };
                    return (
                      <tr key={sub.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{sub.user.firstName} {sub.user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-foreground">{sub.plan.name}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(sub.plan.price)}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                          {new Date(sub.startDate).toLocaleDateString("fr-FR")} →{" "}
                          {new Date(sub.endDate).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {editingCredits?.id === sub.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                value={editingCredits.value}
                                onChange={(e) => setEditingCredits({ id: sub.id, value: Number(e.target.value) })}
                                className="w-14 border border-input rounded px-2 py-0.5 text-center text-sm"
                                min={0}
                                max={sub.plan.totalCourses}
                              />
                              <button onClick={() => saveCredits(sub.id, editingCredits.value)} className="text-green-600 hover:text-green-800">✓</button>
                              <button onClick={() => setEditingCredits(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingCredits({ id: sub.id, value: sub.remainingCredits })}
                              className="font-medium text-foreground hover:text-primary transition-colors"
                              title="Cliquer pour modifier"
                            >
                              {sub.remainingCredits}/{sub.plan.totalCourses}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={loadSubscriptions} className="text-muted-foreground hover:text-foreground" title="Rafraîchir">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            {sub.status === "ACTIVE" && (
                              <button onClick={() => cancelSubscription(sub.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Annuler">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
