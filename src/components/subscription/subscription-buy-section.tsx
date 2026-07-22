"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  totalCourses: number;
  cycleType: string;
  price: number;
}

const CYCLE_LABELS: Record<string, string> = {
  monthly: "1 mois",
  mensuel: "1 mois",
  quarterly: "3 mois",
  trimestriel: "3 mois",
  semestrial: "6 mois",
  semestriel: "6 mois",
  yearly: "1 an",
  annuel: "1 an",
};

export function SubscriptionBuySection({ plans }: { plans: Plan[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(planId: string) {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue");
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Une erreur est survenue, veuillez réessayer.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-card border border-border rounded-xl p-5 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <p className="font-semibold text-foreground">{plan.name}</p>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {CYCLE_LABELS[plan.cycleType] ?? plan.cycleType}
              </span>
            </div>
            {plan.description && (
              <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
            )}
            <div className="flex items-center gap-1.5 mb-4">
              <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
              <span className="text-sm text-foreground">{plan.totalCourses} cours inclus</span>
            </div>
            <div className="mt-auto flex items-center justify-between">
              <p className="text-xl font-bold text-primary">{plan.price.toFixed(2)} €</p>
              <button
                onClick={() => handleBuy(plan.id)}
                disabled={loading === plan.id}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading === plan.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Souscrire
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
