"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export function BonCadeauForm({ services }: { services: Service[] }) {
  const [form, setForm] = useState({
    serviceTypeId: "",
    purchaserName: "",
    purchaserEmail: "",
    recipientEmail: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const selected = services.find((s) => s.id === form.serviceTypeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.serviceTypeId) { setError("Veuillez choisir un service."); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        recipientEmail: form.recipientEmail || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); setLoading(false); return; }
    window.location.href = data.checkoutUrl;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Service à offrir *
        </label>
        <select
          value={form.serviceTypeId}
          onChange={set("serviceTypeId")}
          required
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Choisissez un service...</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {formatPrice(s.price)}
            </option>
          ))}
        </select>
        {selected && (
          <p className="text-xs text-muted-foreground mt-1">
            {selected.durationMinutes} min · {formatPrice(selected.price)}
          </p>
        )}
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-sm font-medium text-foreground mb-3">Vos coordonnées *</p>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Votre nom et prénom *"
            value={form.purchaserName}
            onChange={set("purchaserName")}
            required
            className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="email"
            placeholder="Votre email (pour recevoir le PDF) *"
            value={form.purchaserEmail}
            onChange={set("purchaserEmail")}
            required
            className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-sm font-medium text-foreground mb-1">
          Email du bénéficiaire{" "}
          <span className="text-muted-foreground font-normal">(optionnel)</span>
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Si renseigné, le PDF lui sera aussi envoyé directement.
        </p>
        <input
          type="email"
          placeholder="email@exemple.fr"
          value={form.recipientEmail}
          onChange={set("recipientEmail")}
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {selected && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Total à payer</span>
          <span className="text-xl font-bold text-primary">{formatPrice(selected.price)}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !form.serviceTypeId}
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "🎁"}
        {loading ? "Redirection..." : "Payer et recevoir le bon cadeau"}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Paiement sécurisé par Stripe. Le PDF est envoyé immédiatement après le paiement.
      </p>
    </form>
  );
}
