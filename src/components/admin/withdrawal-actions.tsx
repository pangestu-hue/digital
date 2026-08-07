"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WithdrawalActions({ txId, userId, amount }: { txId: string; userId: string; amount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    setLoading(true);
    const res = await fetch("/api/admin/withdrawals/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txId, userId, amount, action }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Gagal memproses");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction("approve")}
        disabled={loading}
        className="rounded-md bg-accent px-3 py-1 text-xs text-accent-foreground"
      >
        Setujui
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={loading}
        className="rounded-md border border-destructive px-3 py-1 text-xs text-destructive"
      >
        Tolak
      </button>
    </div>
  );
}
