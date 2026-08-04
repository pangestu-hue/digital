"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import type { Category } from "@/types";

interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  type: "digital" | "physical";
  category_id: string | null;
  description: string;
  price: number;
  discount_percent: number;
  stock: number | null;
  weight_grams: number | null;
  cover_image: string | null;
  tags: string;
  status: "draft" | "published" | "archived";
  download_limit_days: number | null;
}

const EMPTY: ProductFormValues = {
  name: "",
  slug: "",
  type: "digital",
  category_id: null,
  description: "",
  price: 0,
  discount_percent: 0,
  stock: 0,
  weight_grams: null,
  cover_image: null,
  tags: "",
  status: "draft",
  download_limit_days: null,
};

export function ProductForm({ initial }: { initial?: Partial<ProductFormValues> }) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({ ...EMPTY, ...initial });
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(values.id);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      setCategories((data as Category[]) ?? []);
    })();
  }, []);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      set("cover_image", data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        name: values.name,
        slug: values.slug || slugify(values.name),
        type: values.type,
        category_id: values.category_id || null,
        description: values.description || null,
        price: Number(values.price),
        discount_percent: Number(values.discount_percent),
        stock: values.type === "physical" ? Number(values.stock ?? 0) : null,
        weight_grams: values.type === "physical" ? Number(values.weight_grams ?? 0) : null,
        cover_image: values.cover_image,
        tags: values.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: values.status,
        download_limit_days: values.type === "digital" ? values.download_limit_days || null : null,
      };

      if (isEdit && values.id) {
        const { error: updateError } = await supabase.from("products").update(payload).eq("id", values.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("products").insert(payload);
        if (insertError) throw insertError;
      }

      router.push("/admin/produk");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Nama Produk</label>
        <Input
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={() => !values.slug && set("slug", slugify(values.name))}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Slug URL</label>
        <Input value={values.slug} onChange={(e) => set("slug", slugify(e.target.value))} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Tipe</label>
          <select
            value={values.type}
            onChange={(e) => set("type", e.target.value as "digital" | "physical")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="digital">Digital</option>
            <option value="physical">Fisik</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Kategori</label>
          <select
            value={values.category_id ?? ""}
            onChange={(e) => set("category_id", e.target.value || null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Harga (Rp)</label>
          <Input
            type="number"
            value={values.price}
            onChange={(e) => set("price", Number(e.target.value))}
            required
            min={0}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Diskon (%)</label>
          <Input
            type="number"
            value={values.discount_percent}
            onChange={(e) => set("discount_percent", Number(e.target.value))}
            min={0}
            max={100}
          />
        </div>
      </div>

      {values.type === "physical" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Stok</label>
            <Input
              type="number"
              value={values.stock ?? 0}
              onChange={(e) => set("stock", Number(e.target.value))}
              min={0}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Berat (gram)</label>
            <Input
              type="number"
              value={values.weight_grams ?? 0}
              onChange={(e) => set("weight_grams", Number(e.target.value))}
              min={0}
            />
          </div>
        </div>
      )}

      {values.type === "digital" && (
        <div>
          <label className="mb-1 block text-sm font-medium">Masa unduh (hari, kosongkan = tanpa batas)</label>
          <Input
            type="number"
            value={values.download_limit_days ?? ""}
            onChange={(e) => set("download_limit_days", e.target.value ? Number(e.target.value) : null)}
            min={1}
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Deskripsi</label>
        <textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tag (pisahkan koma)</label>
        <Input value={values.tags} onChange={(e) => set("tags", e.target.value)} placeholder="ebook, bisnis" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Gambar Cover</label>
        {values.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={values.cover_image} alt="" className="mb-2 h-24 w-24 rounded-md object-cover" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          disabled={uploading}
        />
        {uploading && <p className="text-xs text-muted-foreground">Mengupload...</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Status</label>
        <select
          value={values.status}
          onChange={(e) => set("status", e.target.value as ProductFormValues["status"])}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={saving || uploading} className="w-auto">
        {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
      </Button>
    </form>
  );
}
