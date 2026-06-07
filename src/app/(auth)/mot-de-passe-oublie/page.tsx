"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setSent(true);
    } else {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
    setLoading(false);
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
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">Email envoyé !</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Si un compte existe avec cette adresse, vous recevrez un email avec un lien de réinitialisation valable 1 heure.
              </p>
              <Link href="/connexion" className="text-primary hover:underline text-sm font-medium">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Mot de passe oublié</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Entrez votre adresse email pour recevoir un lien de réinitialisation.
              </p>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="votre@email.fr"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Envoyer le lien
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <Link href="/connexion" className="text-primary hover:underline font-medium">
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
