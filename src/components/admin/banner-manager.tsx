"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Banner } from "@/types";

export function BannerManager({ initial }: { initial: Banner[] }) {
  const [banners, setBanners] = useState<Banner[]>(initial);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase.from("banners").select("*").order("priority", { ascending: false });
    setBanners((data as Banner[]) ?? []);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("banners").upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("banners").getPublicUrl(path);
      setMediaUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !mediaUrl) {
      setError("Judul dan gambar wajib diisi");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("banners").insert({
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      link_url: linkUrl.trim() || null,
      media_url: mediaUrl,
      media_type: "image",
      priority: banners.length,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setTitle("");
    setSubtitle("");
    setLinkUrl("");
    setMediaUrl(null);
    await refresh();
  }

  async function handleTogglePublish(banner: Banner) {
    const supabase = createClient();
    await supabase.from("banners").update({ is_published: !banner.is_published }).eq("id", banner.id);
    await refresh();
  }

  async function handleDelete(banner: Banner) {
    if (!confirm(`Hapus banner "${banner.title}"?`)) return;
    const supabase = createClient();
    await supabase.from("banners").delete().eq("id", banner.id);
    await refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-8 max-w-md space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-display font-semibold">Tambah Banner</h2>
        <Input placeholder="Judul" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Sub judul (opsional)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        <Input placeholder="Link tujuan (opsional)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        <div>
          {mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="mb-2 aspect-[21/9] w-full rounded-md object-cover" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            disabled={uploading}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={saving || uploading} className="w-auto">
          {saving ? "Menyimpan..." : "Tambah Banner"}
        </Button>
      </form>

      <div className="space-y-3">
        {banners.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.media_url} alt="" className="h-14 w-24 rounded-md object-cover" />
            <div className="flex-1">
              <p className="text-sm font-medium">{b.title}</p>
              {b.subtitle && <p className="text-xs text-muted-foreground">{b.subtitle}</p>}
            </div>
            <button
              onClick={() => handleTogglePublish(b)}
              className={`rounded-full px-2 py-0.5 text-xs ${
                b.is_published ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
              }`}
            >
              {b.is_published ? "Publish" : "Draft"}
            </button>
            <button onClick={() => handleDelete(b)} className="text-xs text-destructive hover:underline">
              Hapus
            </button>
          </div>
        ))}
        {banners.length === 0 && <p className="text-sm text-muted-foreground">Belum ada banner.</p>}
      </div>
    </div>
  );
}
