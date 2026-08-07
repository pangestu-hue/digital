"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CheckinCard({ alreadyCheckedIn, streak, dailyCoin }: {
  alreadyCheckedIn: boolean;
  streak: number;
  dailyCoin: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyCheckedIn);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/checkin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal check-in");
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border p-6 text-center">
      <p className="text-sm text-muted-foreground">Streak check-in kamu</p>
      <p className="font-display text-3xl font-semibold text-primary">{streak} hari</p>
      <p className="mt-1 text-sm text-muted-foreground">+{dailyCoin} koin setiap check-in harian</p>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <Button onClick={handleCheckin} disabled={loading || done} className="mt-4 w-auto">
        {done ? "Sudah check-in hari ini ✓" : loading ? "Memproses..." : "Check-in Sekarang"}
      </Button>
    </div>
  );
}
