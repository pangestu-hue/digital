import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const schema = z.object({ amount: z.number().int().positive() });

export async function POST(req: Request) {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 });
  }
  const { amount } = parsed.data;

  const admin = createAdminClient();
  const [{ data: settings }, { data: profile }] = await Promise.all([
    admin.from("wallet_settings").select("min_withdrawal, admin_fee_percent").eq("id", 1).maybeSingle(),
    admin.from("profiles").select("balance").eq("id", user.id).maybeSingle(),
  ]);

  const minWithdrawal = settings?.min_withdrawal ?? 50000;
  const feePercent = settings?.admin_fee_percent ?? 0;

  if (amount < minWithdrawal) {
    return NextResponse.json(
      { error: `Minimal penarikan Rp${minWithdrawal.toLocaleString("id-ID")}` },
      { status: 400 }
    );
  }
  if (!profile || profile.balance < amount) {
    return NextResponse.json({ error: "Saldo tidak cukup" }, { status: 400 });
  }

  const fee = Math.round(amount * (feePercent / 100));
  const payout = amount - fee;

  const { error: balanceError } = await admin
    .from("profiles")
    .update({ balance: profile.balance - amount })
    .eq("id", user.id);
  if (balanceError) {
    return NextResponse.json({ error: "Gagal memproses penarikan" }, { status: 500 });
  }

  const { error: txError } = await admin.from("wallet_transactions").insert({
    user_id: user.id,
    type: "withdrawal",
    amount: -amount,
    status: "pending",
    note: `Penarikan Rp${amount.toLocaleString("id-ID")} (biaya admin Rp${fee.toLocaleString("id-ID")}, diterima Rp${payout.toLocaleString("id-ID")})`,
  });
  if (txError) {
    await admin.from("profiles").update({ balance: profile.balance }).eq("id", user.id);
    return NextResponse.json({ error: "Gagal mencatat permintaan penarikan" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, payout });
}
