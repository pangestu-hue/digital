"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";

interface WalletTx {
  id: string;
  type: string;
  amount: number;
  status: string;
  note: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  topup: "Top Up",
  purchase: "Pembelian",
  withdrawal: "Penarikan",
  refund: "Refund",
  referral_bonus: "Bonus Referral",
};

export function WalletPanel({
  balance,
  transactions,
  minTopup,
  minWithdrawal,
}: {
  balance: number;
  transactions: WalletTx[];
  minTopup: number;
  minWithdrawal: number;
}) {
  const [topupAmount, setTopupAmount] = useState(minTopup);
  const [withdrawAmount, setWithdrawAmount] = useState(minWithdrawal);
  const [loadingTopup, setLoadingTopup] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  async function handleTopup() {
    setError(null);
    setLoadingTopup(true);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: topupAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal top up");
      window.location.href = data.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLoadingTopup(false);
    }
  }

  async function handleWithdraw() {
    setError(null);
    setWithdrawSuccess(false);
    setLoadingWithdraw(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: withdrawAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengajukan penarikan");
      setWithdrawSuccess(true);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoadingWithdraw(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">Saldo Kamu</p>
        <p className="font-display text-3xl font-semibold text-primary">{formatIDR(balance)}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <section className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="font-display font-semibold">Top Up Saldo</h2>
        <Input
          type="number"
          value={topupAmount}
          onChange={(e) => setTopupAmount(Number(e.target.value))}
          min={minTopup}
        />
        <p className="text-xs text-muted-foreground">Minimal top up {formatIDR(minTopup)}</p>
        <Button onClick={handleTopup} disabled={loadingTopup} className="w-auto">
          {loadingTopup ? "Memproses..." : "Top Up via Pakasir"}
        </Button>
      </section>

      <section className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="font-display font-semibold">Tarik Saldo</h2>
        <Input
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(Number(e.target.value))}
          min={minWithdrawal}
        />
        <p className="text-xs text-muted-foreground">
          Minimal penarikan {formatIDR(minWithdrawal)}. Permintaan diproses admin dalam 1-2 hari kerja.
        </p>
        {withdrawSuccess && <p className="text-sm text-accent">Permintaan penarikan berhasil diajukan.</p>}
        <Button onClick={handleWithdraw} disabled={loadingWithdraw} variant="outline" className="w-auto">
          {loadingWithdraw ? "Memproses..." : "Ajukan Penarikan"}
        </Button>
      </section>

      <section>
        <h2 className="mb-2 font-display font-semibold">Riwayat Transaksi</h2>
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <div>
                <p className="font-medium">{TYPE_LABEL[tx.type] ?? tx.type}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.created_at).toLocaleDateString("id-ID")} · {tx.status}
                </p>
              </div>
              <span className={tx.amount >= 0 ? "text-accent" : "text-destructive"}>
                {tx.amount >= 0 ? "+" : ""}
                {formatIDR(tx.amount)}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
          )}
        </div>
      </section>
    </div>
  );
}
