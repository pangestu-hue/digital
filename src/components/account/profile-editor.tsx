"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import type { Profile } from "@/types";

export function ProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload foto");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username, avatar_url: avatarUrl })
        .eq("id", profile.id);
      if (updateError) throw updateError;
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (!confirm("Hapus akun secara permanen? Semua data kamu tidak bisa dikembalikan.")) return;
    if (!confirm("Yakin? Ini tindakan terakhir dan tidak bisa dibatalkan.")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error("Gagal menghapus akun");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-md space-y-8">
      <section className="grid grid-cols-3 gap-4 rounded-lg border border-border p-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className="font-display font-semibold">{formatIDR(profile.balance)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Koin</p>
          <p className="font-display font-semibold">{profile.coin}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Kode Referral</p>
          <p className="font-display font-semibold">{profile.referral_code}</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
            disabled={uploading}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Username</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <Input value={profile.email} disabled />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-accent">Profil berhasil disimpan.</p>}

        <Button onClick={handleSave} disabled={saving || uploading} className="w-auto">
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </section>

      <section className="space-y-2 border-t border-border pt-6">
        <Button variant="outline" onClick={handleLogout} className="w-auto">
          Keluar
        </Button>
        <div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="text-sm text-destructive hover:underline"
          >
            {deleting ? "Menghapus..." : "Hapus Akun"}
          </button>
        </div>
      </section>
    </div>
  );
}
