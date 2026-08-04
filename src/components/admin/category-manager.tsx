"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import type { Category } from "@/types";

export function CategoryManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories((data as Category[]) ?? []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("categories").insert({
      name: name.trim(),
      slug: slugify(name),
      sort_order: categories.length,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setName("");
    await refresh();
  }

  async function handleToggleActive(cat: Category) {
    const supabase = createClient();
    await supabase.from("categories").update({ is_active: !cat.is_active }).eq("id", cat.id);
    await refresh();
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Hapus kategori "${cat.name}"?`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", cat.id);
    if (deleteError) {
      alert("Gagal menghapus — mungkin masih dipakai produk lain: " + deleteError.message);
      return;
    }
    await refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 flex max-w-md gap-2">
        <Input placeholder="Nama kategori baru" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={saving} className="w-auto flex-shrink-0">
          Tambah
        </Button>
      </form>
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Nama</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleToggleActive(c)}
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      c.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.is_active ? "Aktif" : "Nonaktif"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleDelete(c)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
