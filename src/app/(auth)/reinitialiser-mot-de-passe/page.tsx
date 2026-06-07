"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ReinitialiserMotDePassePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { setError("Le mot de passe doit faire au moins 8 caractères."); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    router.push("/connexion?reset=success");
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-destructive font-medium mb-4">Lien invalide ou expiré.</p>
          <Link href="/mot-de-passe-oublie" className="text-primary hover:underline text-sm">
            Faire une nouvelle demande
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-heading text-3xl font-semibold text-primary">Artisanat Cases</h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Atelier de poterie</p>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Nouveau mot de passe</h2>
          <p className="text-muted-foreground text-sm mb-6">Choisissez un nouveau mot de passe pour votre compte.</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="8 caractères minimum"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Réinitialiser mon mot de passe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
