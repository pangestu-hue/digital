import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function POST() {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("coin, checkin_streak, last_checkin_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 });
  }

  const today = todayStr();
  if (profile.last_checkin_at === today) {
    return NextResponse.json({ error: "Kamu sudah check-in hari ini" }, { status: 400 });
  }

  const { data: settings } = await admin.from("coin_settings").select("daily_coin").eq("id", 1).maybeSingle();
  const dailyCoin = settings?.daily_coin ?? 10;

  const newStreak = profile.last_checkin_at === yesterdayStr() ? profile.checkin_streak + 1 : 1;

  const { error } = await admin
    .from("profiles")
    .update({
      coin: profile.coin + dailyCoin,
      checkin_streak: newStreak,
      last_checkin_at: today,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Gagal check-in" }, { status: 500 });
  }

  await admin.from("coin_ledger").insert({
    user_id: user.id,
    amount: dailyCoin,
    reason: "checkin",
  });

  return NextResponse.json({ ok: true, coinEarned: dailyCoin, streak: newStreak });
}
