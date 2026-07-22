"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function SubscriptionCancelButton({
  subscriptionId,
  planName,
}: {
  subscriptionId: string;
  planName: string;
}) {
  const [step, setStep] = useState<"idle" | "confirm" | "done" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleCancel() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, { method: "POST" });
      if (res.ok) {
        setStep("done");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Une erreur est survenue.");
        setStep("error");
      }
    } catch {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return <span className="text-sm text-green-700 py-1.5 px-3">✅ Annulé</span>;
  }

  if (step === "error") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-destructive">{errorMsg}</span>
        <button onClick={() => setStep("idle")} className="text-xs underline text-muted-foreground">Réessayer</button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex gap-1.5">
        <button
          onClick={() => setStep("idle")}
          className="text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-secondary"
        >
          Retour
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-xs bg-destructive text-white px-3 py-1.5 rounded-lg hover:bg-destructive/90 disabled:opacity-50 flex items-center gap-1"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          Confirmer
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep("confirm")}
      className="text-xs text-destructive hover:underline py-1.5 px-3 border border-destructive/20 rounded-lg hover:bg-destructive/5 transition-colors"
    >
      Annuler l'abonnement
    </button>
  );
}
