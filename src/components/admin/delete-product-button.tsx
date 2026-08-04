"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Hapus produk "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    setLoading(false);
    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs text-destructive hover:underline">
      {loading ? "Menghapus..." : "Hapus"}
    </button>
  );
}
