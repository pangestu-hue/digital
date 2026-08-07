import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ReferralShare } from "@/components/account/referral-share";

export default async function ReferralPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const [{ data: profile }, { data: settings }, { data: referrals }] = await Promise.all([
    admin.from("profiles").select("referral_code").eq("id", user!.id).maybeSingle(),
    admin.from("referral_settings").select("*").eq("id", 1).maybeSingle(),
    admin
      .from("referrals")
      .select("reward_granted, created_at, profiles!referrals_referee_id_fkey(username)")
      .eq("referrer_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-md space-y-6">
      <h1 className="font-display text-2xl font-semibold">Referral</h1>

      <ReferralShare referralCode={profile?.referral_code ?? ""} />

      {settings && (
        <div className="rounded-lg border border-border p-4 text-sm">
          <h2 className="mb-2 font-display font-semibold">Hadiah Referral</h2>
          <p className="text-muted-foreground">
            Dapatkan{" "}
            {settings.reward_coin > 0 && <span className="font-medium text-foreground">{settings.reward_coin} koin</span>}
            {settings.reward_coin > 0 && settings.reward_balance > 0 && " + "}
            {settings.reward_balance > 0 && (
              <span className="font-medium text-foreground">
                Rp{settings.reward_balance.toLocaleString("id-ID")}
              </span>
            )}{" "}
            setiap temanmu daftar pakai kodemu dan berhasil belanja pertama kali.
          </p>
        </div>
      )}

      <div>
        <h2 className="mb-2 font-display font-semibold">Orang yang Kamu Ajak</h2>
        {referrals && referrals.length > 0 ? (
          <div className="space-y-2">
            {referrals.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>{r.profiles?.username ?? "User"}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    r.reward_granted ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.reward_granted ? "Hadiah diberikan" : "Menunggu pembelian pertama"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada yang pakai kode referral kamu.</p>
        )}
      </div>
    </div>
  );
}
