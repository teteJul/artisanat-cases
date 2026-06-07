"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function InscriptionPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (form.password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email: form.email, password: form.password, callbackUrl: "/mon-espace" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-heading text-3xl font-semibold text-primary">Artisanat Cases</h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Atelier de poterie</p>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Créer un compte</h2>
          <p className="text-muted-foreground text-sm mb-6">Réservez vos cours et gérez vos abonnements.</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Prénom</label>
                <input type="text" value={form.firstName} onChange={set("firstName")} required className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Marie" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nom</label>
                <input type="text" value={form.lastName} onChange={set("lastName")} required className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Dupont" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set("email")} required className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="votre@email.fr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Téléphone <span className="text-muted-foreground font-normal">(optionnel)</span></label>
              <input type="tel" value={form.phone} onChange={set("phone")} className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="06 00 00 00 00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Mot de passe</label>
              <input type="password" value={form.password} onChange={set("password")} required className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="8 caractères minimum" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirmer le mot de passe</label>
              <input type="password" value={form.confirm} onChange={set("confirm")} required className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer mon compte
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-primary hover:underline font-medium">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
