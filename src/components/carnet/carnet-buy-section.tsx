"use client";

import { useState } from "react";
import { Loader2, BookOpen } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CarnetPlan {
  id: string;
  name: string;
  numberOfSessions: number;
  price: number;
  validityMonths: number;
  serviceType: { id: string; name: string };
}

export function CarnetBuySection({ plans }: { plans: CarnetPlan[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(planId: string) {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/carnets", {
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

  // Grouper par service
  const byService = plans.reduce<Record<string, CarnetPlan[]>>((acc, p) => {
    const key = p.serviceType.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}
      {Object.entries(byService).map(([serviceName, servicePlans]) => (
        <div key={serviceName}>
          <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {serviceName}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {servicePlans.map((plan) => (
              <div key={plan.id} className="bg-card border border-border rounded-xl p-5 flex flex-col">
                <p className="font-semibold text-foreground mb-1">{plan.name}</p>
                <p className="text-sm text-muted-foreground mb-3">
                  {plan.numberOfSessions} cours · valable {plan.validityMonths} mois
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <p className="text-xl font-bold text-primary">{formatPrice(plan.price)}</p>
                  <button
                    onClick={() => handleBuy(plan.id)}
                    disabled={loading === plan.id}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {loading === plan.id && <Loader2 className="w-4 h-4 animate-spin" />}
                    Acheter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
