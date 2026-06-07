"use client";

import { useState, useEffect } from "react";
import { formatDate, formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Gift, Loader2, CheckCircle, ArrowRight } from "lucide-react";

interface GiftVoucher {
  id: string;
  code: string;
  description: string | null;
  status: string;
  amountValue: number | null;
  expiresAt: string | null;
  redeemedAt: string | null;
  createdAt: string;
  purchaserName: string | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Disponible", className: "bg-green-100 text-green-700" },
  REDEEMED: { label: "Utilisé", className: "bg-secondary text-muted-foreground" },
  EXPIRED: { label: "Expiré", className: "bg-red-100 text-red-600" },
  CANCELLED: { label: "Annulé", className: "bg-secondary text-muted-foreground" },
};

export default function MesBonsCadeauPage() {
  const [vouchers, setVouchers] = useState<GiftVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeResult, setCodeResult] = useState<{ success?: boolean; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/user/vouchers")
      .then((r) => r.json())
      .then((data) => { setVouchers(data); setLoading(false); });
  }, []);

  async function redeemCode(e: React.FormEvent) {
    e.preventDefault();
    setCodeLoading(true);
    setCodeResult(null);

    const res = await fetch("/api/vouchers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.toUpperCase().trim() }),
    });
    const data = await res.json();

    if (res.ok) {
      setCodeResult({ success: true });
      setCode("");
      // Recharger la liste
      const updated = await fetch("/api/user/vouchers").then((r) => r.json());
      setVouchers(updated);
    } else {
      setCodeResult({ error: data.error });
    }
    setCodeLoading(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Mes bons cadeaux</h1>
        <p className="text-muted-foreground mt-1">Gérez vos bons cadeaux et entrez un code reçu.</p>
      </div>

      {/* Entrer un code */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h2 className="font-semibold text-foreground mb-1">Vous avez reçu un bon cadeau ?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Entrez votre code pour l'ajouter à votre compte et l'utiliser lors d'une réservation.
        </p>
        <form onSubmit={redeemCode} className="flex gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            maxLength={9}
            className="flex-1 border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono uppercase tracking-widest"
          />
          <button
            type="submit"
            disabled={codeLoading || code.length < 4}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {codeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
            Valider
          </button>
        </form>

        {codeResult?.success && (
          <div className="mt-3 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            Bon cadeau ajouté à votre compte !
          </div>
        )}
        {codeResult?.error && (
          <p className="mt-3 text-destructive text-sm">{codeResult.error}</p>
        )}
      </div>

      {/* Liste des bons */}
      <div>
        <h2 className="font-semibold text-foreground mb-4">Mes bons cadeaux ({vouchers.length})</h2>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : vouchers.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
            <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Aucun bon cadeau sur votre compte.</p>
            <p className="text-sm text-muted-foreground">
              Entrez un code ci-dessus ou{" "}
              <Link href="/bon-cadeau" className="text-primary hover:underline">
                offrez un bon cadeau
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vouchers.map((v) => {
              const statusInfo = STATUS_LABELS[v.status] ?? { label: v.status, className: "bg-secondary" };
              const isActive = v.status === "ACTIVE";
              const expiresSoon = isActive && v.expiresAt &&
                new Date(v.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              return (
                <div
                  key={v.id}
                  className={`bg-card border rounded-xl p-5 ${!isActive ? "opacity-60" : expiresSoon ? "border-amber-300" : "border-border"}`}
                >
                  {/* En-tête */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground text-sm">{v.description ?? "Bon cadeau"}</p>
                        {v.purchaserName && (
                          <p className="text-xs text-muted-foreground">Offert par {v.purchaserName}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Code */}
                  <div className="bg-secondary/50 rounded-lg px-3 py-2 mb-3">
                    <p className="font-mono text-sm font-bold text-foreground tracking-widest text-center">
                      {v.code}
                    </p>
                  </div>

                  {/* Infos */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {v.amountValue && (
                      <p>Valeur : <span className="font-semibold text-primary">{formatPrice(v.amountValue)}</span></p>
                    )}
                    {v.expiresAt && (
                      <p className={expiresSoon ? "text-amber-600 font-medium" : ""}>
                        {isActive ? "Expire le" : "Expiré le"} {formatDate(v.expiresAt)}
                      </p>
                    )}
                    {v.redeemedAt && (
                      <p>Utilisé le {formatDate(v.redeemedAt)}</p>
                    )}
                  </div>

                  {isActive && (
                    <Link
                      href={`/reserver?voucherId=${v.id}`}
                      className="mt-3 flex items-center justify-center gap-1.5 text-sm text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-primary/5 transition-colors"
                    >
                      Utiliser pour réserver <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Acheter un bon cadeau */}
      <div className="mt-8 bg-primary/10 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-foreground">Offrir un bon cadeau</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Faites plaisir à vos proches avec un cours de poterie.
          </p>
        </div>
        <Link
          href="/bon-cadeau"
          className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Gift className="w-4 h-4" />
          Acheter un bon cadeau
        </Link>
      </div>
    </div>
  );
}
