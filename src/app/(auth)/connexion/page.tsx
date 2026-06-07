"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/mon-espace";
  const resetSuccess = searchParams.get("reset") === "success";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
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
          <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Connexion</h2>
          <p className="text-muted-foreground text-sm mb-6">Accédez à votre espace personnel.</p>

          {resetSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3 mb-4">
              Mot de passe réinitialisé ! Vous pouvez vous connecter.
            </div>
          )}

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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-foreground">Mot de passe</label>
                <Link href="/mot-de-passe-oublie" className="text-xs text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              Se connecter
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-primary hover:underline font-medium">
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
