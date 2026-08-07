import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CheckinCard } from "@/components/account/checkin-card";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function CheckinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const [{ data: profile }, { data: settings }] = await Promise.all([
    admin.from("profiles").select("checkin_streak, last_checkin_at").eq("id", user!.id).maybeSingle(),
    admin.from("coin_settings").select("daily_coin").eq("id", 1).maybeSingle(),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Check-in Harian</h1>
      <CheckinCard
        alreadyCheckedIn={profile?.last_checkin_at === todayStr()}
        streak={profile?.checkin_streak ?? 0}
        dailyCoin={settings?.daily_coin ?? 10}
      />
    </div>
  );
}
