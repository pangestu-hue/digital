"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["pending", "paid", "processing", "shipped", "completed", "cancelled", "refunded"];

export function OrderStatusSelect({ orderId, current }: { orderId: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);

  async function handleChange(newStatus: string) {
    setStatus(newStatus);
    setSaving(true);
    const supabase = createClient();
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
