"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Voucher {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase: number;
  quota: number | null;
  used_count: number;
  is_active: boolean;
}

export function VoucherManager({ initial }: { initial: Voucher[] }) {
  const [vouchers, setVouchers] = useState<Voucher[]>(initial);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState(10);
  const [minPurchase, setMinPurchase] = useState(0);
  const [quota, setQuota] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase.from("vouchers").select("*").order("created_at", { ascending: false });
    setVouchers((data as Voucher[]) ?? []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("vouchers").insert({
      code: code.trim().toUpperCase(),
      scope: "all",
      discount_type: discountType,
      discount_value: discountValue,
      min_purchase: minPurchase,
      quota: quota === "" ? null : Number(quota),
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setCode("");
    setDiscountValue(10);
    setMinPurchase(0);
    setQuota("");
    await refresh();
  }

  async function handleToggleActive(v: Voucher) {
    const supabase = createClient();
    await supabase.from("vouchers").update({ is_active: !v.is_active }).eq("id", v.id);
    await refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-8 max-w-md space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-display font-semibold">Buat Voucher</h2>
        <Input placeholder="Kode voucher (mis. SAUMA10)" value={code} onChange={(e) => setCode(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="percentage">Persen (%)</option>
            <option value="fixed">Nominal (Rp)</option>
          </select>
          <Input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            min={0}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Minimal pembelian (Rp)</label>
          <Input type="number" value={minPurchase} onChange={(e) => setMinPurchase(Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Kuota (kosongkan = tanpa batas)</label>
          <Input
            type="number"
            value={quota}
            onChange={(e) => setQuota(e.target.value ? Number(e.target.value) : "")}
            min={1}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={saving} className="w-auto">
          {saving ? "Menyimpan..." : "Buat Voucher"}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Kode</th>
              <th className="p-3">Diskon</th>
              <th className="p-3">Min. Belanja</th>
              <th className="p-3">Terpakai</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id} className="border-t border-border">
                <td className="p-3 font-mono font-medium">{v.code}</td>
                <td className="p-3">
                  {v.discount_type === "percentage" ? `${v.discount_value}%` : `Rp${v.discount_value}`}
                </td>
                <td className="p-3">Rp{v.min_purchase.toLocaleString("id-ID")}</td>
                <td className="p-3">
                  {v.used_count}
                  {v.quota ? ` / ${v.quota}` : ""}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleToggleActive(v)}
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      v.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {v.is_active ? "Aktif" : "Nonaktif"}
                  </button>
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Belum ada voucher.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
