"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  imageUrls: string[];
  isAvailable: boolean;
  sortOrder: number;
}

interface PaintingPiece {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

export function CatalogueAdmin({
  initialItems,
  initialPieces,
}: {
  initialItems: CatalogItem[];
  initialPieces: PaintingPiece[];
}) {
  const [tab, setTab] = useState<"catalogue" | "pieces">("catalogue");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-secondary/50 p-1 rounded-lg w-fit">
        {(["catalogue", "pieces"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "catalogue" ? "🏺 Catalogue boutique" : "🎨 Pièces à peindre"}
          </button>
        ))}
      </div>

      {tab === "catalogue" ? (
        <CatalogueSection initialItems={initialItems} />
      ) : (
        <PiecesSection initialPieces={initialPieces} />
      )}
    </div>
  );
}

function CatalogueSection({ initialItems }: { initialItems: CatalogItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  async function addItem() {
    if (!form.name) return;
    setLoading(true);
    const res = await fetch("/api/admin/catalogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        imageUrls: form.imageUrl ? [form.imageUrl] : [],
        sortOrder: items.length,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems([...items, data]);
      setForm({ name: "", description: "", imageUrl: "" });
    }
    setLoading(false);
  }

  async function toggleAvailable(id: string, val: boolean) {
    await fetch("/api/admin/catalogue", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isAvailable: val }),
    });
    setItems(items.map((i) => (i.id === id ? { ...i, isAvailable: val } : i)));
  }

  async function deleteItem(id: string) {
    if (!confirm("Supprimer cet article ?")) return;
    await fetch("/api/admin/catalogue", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems(items.filter((i) => i.id !== id));
  }

  async function saveEdit(id: string) {
    await fetch("/api/admin/catalogue", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    });
    setItems(items.map((i) => (i.id === id ? { ...i, ...editForm } : i)));
    setEditId(null);
  }

  return (
    <div className="space-y-6">
      {/* Formulaire */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-medium text-foreground mb-3">Ajouter un article</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" placeholder="Nom de la pièce *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="text" placeholder="Description (optionnel)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="url" placeholder="URL photo (optionnel)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={addItem} disabled={loading || !form.name} className="mt-3 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Ajouter
        </button>
      </div>

      {/* Liste */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pièce</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Disponible</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Aucun article</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {editId === item.id ? (
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="border border-input rounded px-2 py-1 text-sm bg-background w-full" />
                  ) : item.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {editId === item.id ? (
                    <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="border border-input rounded px-2 py-1 text-sm bg-background w-full" />
                  ) : item.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleAvailable(item.id, !item.isAvailable)} className={`w-8 h-4 rounded-full transition-colors ${item.isAvailable ? "bg-green-500" : "bg-muted"}`}>
                    <div className={`w-3 h-3 bg-white rounded-full mx-auto transition-transform ${item.isAvailable ? "translate-x-1" : "-translate-x-1"}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {editId === item.id ? (
                      <>
                        <button onClick={() => saveEdit(item.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditId(item.id); setEditForm({ name: item.name, description: item.description ?? "" }); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PiecesSection({ initialPieces }: { initialPieces: PaintingPiece[] }) {
  const [pieces, setPieces] = useState(initialPieces);
  const [form, setForm] = useState({ name: "", price: "", description: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", description: "" });
  const [loading, setLoading] = useState(false);

  async function addPiece() {
    if (!form.name || !form.price) return;
    setLoading(true);
    const res = await fetch("/api/admin/painting-pieces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, price: parseFloat(form.price), description: form.description || undefined, sortOrder: pieces.length }),
    });
    const data = await res.json();
    if (res.ok) {
      setPieces([...pieces, { ...data, price: Number(data.price) }]);
      setForm({ name: "", price: "", description: "" });
    }
    setLoading(false);
  }

  async function deletePiece(id: string) {
    if (!confirm("Supprimer cette pièce ?")) return;
    await fetch("/api/admin/painting-pieces", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setPieces(pieces.filter((p) => p.id !== id));
  }

  async function saveEdit(id: string) {
    const res = await fetch("/api/admin/painting-pieces", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editForm.name, price: parseFloat(editForm.price), description: editForm.description }) });
    const data = await res.json();
    setPieces(pieces.map((p) => (p.id === id ? { ...p, ...data, price: Number(data.price) } : p)));
    setEditId(null);
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-medium text-foreground mb-3">Ajouter une pièce à peindre</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" placeholder="Nom (ex: Mug) *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="number" placeholder="Prix (€) *" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} step="0.5" min="0" className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="text" placeholder="Description (optionnel)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={addPiece} disabled={loading || !form.name || !form.price} className="mt-3 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Ajouter
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pièce</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Prix</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pieces.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Aucune pièce</td></tr>}
            {pieces.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {editId === p.id ? <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="border border-input rounded px-2 py-1 text-sm bg-background w-full" /> : p.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {editId === p.id ? <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="border border-input rounded px-2 py-1 text-sm bg-background w-full" /> : p.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-primary">
                  {editId === p.id ? <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} step="0.5" className="border border-input rounded px-2 py-1 text-sm bg-background w-20 text-right" /> : formatPrice(p.price)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {editId === p.id ? (
                      <>
                        <button onClick={() => saveEdit(p.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditId(p.id); setEditForm({ name: p.name, price: String(p.price), description: p.description ?? "" }); }} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deletePiece(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
