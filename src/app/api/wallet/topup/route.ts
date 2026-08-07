import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { buildPakasirPaymentUrl } from "@/lib/pakasir";

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
  const { data: settings } = await admin.from("wallet_settings").select("min_topup").eq("id", 1).maybeSingle();
  const minTopup = settings?.min_topup ?? 10000;

  if (amount < minTopup) {
    return NextResponse.json({ error: `Minimal top up Rp${minTopup.toLocaleString("id-ID")}` }, { status: 400 });
  }

  const { data: tx, error } = await admin
    .from("wallet_transactions")
    .insert({ user_id: user.id, type: "topup", amount, status: "pending", note: "Top up saldo" })
    .select("id")
    .single();

  if (error || !tx) {
    return NextResponse.json({ error: "Gagal membuat transaksi top up" }, { status: 500 });
  }

  // "WT-" prefix lets the Pakasir webhook tell wallet top-ups apart from
  // regular order payments (which use the order_number, e.g. "SS-...").
  const paymentUrl = buildPakasirPaymentUrl({
    orderId: `WT-${tx.id}`,
    amount,
    redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/akun/wallet`,
  });

  return NextResponse.json({ paymentUrl });
}
