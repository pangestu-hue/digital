import { createClient, createAdminClient } from "@/lib/supabase/server";
import { WalletPanel } from "@/components/account/wallet-panel";

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const [{ data: profile }, { data: settings }, { data: transactions }] = await Promise.all([
    admin.from("profiles").select("balance").eq("id", user!.id).maybeSingle(),
    admin.from("wallet_settings").select("*").eq("id", 1).maybeSingle(),
    admin
      .from("wallet_transactions")
      .select("id, type, amount, status, note, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Wallet</h1>
      <WalletPanel
        balance={profile?.balance ?? 0}
        transactions={transactions ?? []}
        minTopup={settings?.min_topup ?? 10000}
        minWithdrawal={settings?.min_withdrawal ?? 50000}
      />
    </div>
  );
}
