"use client";

import { useState } from "react";
import { Mail, Clock, MapPin, Loader2, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSuccess(true);
    } else {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-4">Contact</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Une question ? N'hésitez pas à nous écrire, nous répondons dans les meilleurs délais.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Formulaire */}
        <div className="lg:col-span-3">
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Message envoyé !</h2>
              <p className="text-muted-foreground">
                Nous avons bien reçu votre message et vous répondrons dans les meilleurs délais.
                Un email de confirmation a été envoyé à <strong>{form.email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Nom *</label>
                  <input type="text" value={form.name} onChange={set("name")} required placeholder="Marie Dupont" className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={set("email")} required placeholder="votre@email.fr" className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Téléphone <span className="text-muted-foreground font-normal">(optionnel)</span></label>
                <input type="tel" value={form.phone} onChange={set("phone")} placeholder="06 00 00 00 00" className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Sujet *</label>
                <select value={form.subject} onChange={set("subject")} required className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Choisissez un sujet...</option>
                  <option>Renseignements sur les cours</option>
                  <option>Réservation de cours particulier</option>
                  <option>Anniversaire / événement privé</option>
                  <option>Question sur ma réservation</option>
                  <option>Bon cadeau</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Message *</label>
                <textarea value={form.message} onChange={set("message")} required rows={5} placeholder="Votre message..." className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">{error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Envoyer le message
              </button>
            </form>
          )}
        </div>

        {/* Infos pratiques */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Informations pratiques</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Horaires des cours</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Mercredi & Samedi<br />
                    14h–15h30 / 15h30–17h
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <a href="mailto:manon@artisanatcases.fr" className="text-sm text-primary hover:underline">
                    manon@artisanatcases.fr
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Localisation</p>
                  <p className="text-sm text-muted-foreground">Pyrénées-Orientales (66)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
            <p className="text-sm font-medium text-foreground mb-2">Pour les réservations</p>
            <p className="text-sm text-muted-foreground">
              Vous pouvez réserver directement en ligne via notre système de réservation, disponible
              2 mois à l'avance.
            </p>
            <a href="/reserver" className="inline-block mt-3 text-sm text-primary font-medium hover:underline">
              Réserver un cours →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
