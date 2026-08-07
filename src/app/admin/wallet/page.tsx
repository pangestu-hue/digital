import { createAdminClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import { WithdrawalActions } from "@/components/admin/withdrawal-actions";

export default async function AdminWalletPage() {
  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("wallet_transactions")
    .select("id, user_id, amount, note, created_at, profiles(username, email)")
    .eq("type", "withdrawal")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Wallet — Penarikan Tertunda</h1>

      <div className="space-y-3">
        {(pending ?? []).map((tx: any) => (
          <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">{tx.profiles?.username ?? "User"}</p>
              <p className="text-xs text-muted-foreground">{tx.note}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(tx.created_at).toLocaleString("id-ID")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-destructive">{formatIDR(Math.abs(tx.amount))}</span>
              <WithdrawalActions txId={tx.id} userId={tx.user_id} amount={Math.abs(tx.amount)} />
            </div>
          </div>
        ))}
        {(!pending || pending.length === 0) && (
          <p className="text-muted-foreground">Tidak ada permintaan penarikan tertunda.</p>
        )}
      </div>
    </div>
  );
}
