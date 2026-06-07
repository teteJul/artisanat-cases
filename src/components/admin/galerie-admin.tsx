"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, Plus, GripVertical, Loader2 } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  sortOrder: number;
}

export function GalerieAdmin({ initialImages }: { initialImages: GalleryImage[] }) {
  const [images, setImages] = useState(initialImages);
  const [form, setForm] = useState({ url: "", alt: "", caption: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function addImage() {
    if (!form.url) { setError("L'URL est obligatoire."); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/galerie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sortOrder: images.length }),
    });
    const data = await res.json();
    if (res.ok) {
      setImages([...images, data]);
      setForm({ url: "", alt: "", caption: "" });
    } else {
      setError("Erreur lors de l'ajout.");
    }
    setLoading(false);
  }

  async function deleteImage(id: string) {
    if (!confirm("Supprimer cette image ?")) return;
    await fetch("/api/admin/galerie", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setImages(images.filter((img) => img.id !== id));
  }

  return (
    <div className="space-y-8">
      {/* Formulaire ajout */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold text-foreground mb-4">Ajouter une photo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="sm:col-span-3">
            <label className="block text-xs text-muted-foreground mb-1">URL de l'image *</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Texte alternatif</label>
            <input
              type="text"
              value={form.alt}
              onChange={(e) => setForm({ ...form, alt: e.target.value })}
              placeholder="Description de l'image"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Légende</label>
            <input
              type="text"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              placeholder="Légende affichée au survol"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addImage}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Ajouter
            </button>
          </div>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}

        {/* Aperçu URL */}
        {form.url && (
          <div className="mt-3 relative w-24 h-24 rounded-lg overflow-hidden border border-border">
            <Image src={form.url} alt="Aperçu" fill className="object-cover" onError={() => setError("URL d'image invalide")} />
          </div>
        )}
      </div>

      {/* Grille images */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">{images.length} photo{images.length > 1 ? "s" : ""}</p>
        {images.length === 0 ? (
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl text-muted-foreground">
            Aucune photo. Ajoutez-en une ci-dessus.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {images.map((img) => (
              <div key={img.id} className="group relative rounded-xl overflow-hidden border border-border aspect-square bg-secondary/30">
                <Image src={img.url} alt={img.alt ?? ""} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => deleteImage(img.id)}
                    className="bg-destructive text-white p-2 rounded-lg hover:bg-destructive/90"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {img.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 p-1.5">
                    <p className="text-white text-xs truncate">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
