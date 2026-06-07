"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle, User, Lock } from "lucide-react";

interface Profile {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
}

export default function MonProfilPage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile").then((r) => r.json()).then((data) => {
      setProfile(data);
      setForm({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        phone: data.phone ?? "",
      });
    });
  }, []);

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSuccess("Profil mis à jour !");
      await update();
    } else {
      setError("Erreur lors de la mise à jour.");
    }
    setSaving(false);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (pwForm.newPassword !== pwForm.confirm) { setPwError("Les mots de passe ne correspondent pas."); return; }
    if (pwForm.newPassword.length < 8) { setPwError("8 caractères minimum."); return; }
    setSavingPw(true);
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwSuccess(true);
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } else {
      setPwError(data.error ?? "Erreur.");
    }
    setSavingPw(false);
  }

  if (!profile) return (
    <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Mon profil</h1>
        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infos personnelles */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Informations personnelles
          </h2>
          <form onSubmit={handleProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nom</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-secondary/50 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">L'email ne peut pas être modifié.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="06 00 00 00 00"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}
            {success && (
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle className="w-4 h-4" />{success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Sauvegarder
            </button>
          </form>
        </div>

        {/* Mot de passe */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Changer le mot de passe
          </h2>
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Mot de passe actuel</label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
                placeholder="8 caractères minimum"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirmer</label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                required
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {pwError && <p className="text-destructive text-sm">{pwError}</p>}
            {pwSuccess && (
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle className="w-4 h-4" />
                Mot de passe mis à jour !
              </div>
            )}

            <button
              type="submit"
              disabled={savingPw}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {savingPw && <Loader2 className="w-4 h-4 animate-spin" />}
              Changer le mot de passe
            </button>
          </form>

          {/* Info compte */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Compte créé le {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
