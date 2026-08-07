import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getPakasirTransactionDetail } from "@/lib/pakasir";

async function handleWalletTopup(admin: ReturnType<typeof createAdminClient>, body: any) {
  const txId = body.order_id.slice(3); // strip "WT-"

  const { data: tx } = await admin
    .from("wallet_transactions")
    .select("id, user_id, amount, status")
    .eq("id", txId)
    .maybeSingle();

  if (!tx) {
    return NextResponse.json({ ok: true, note: "wallet tx not found" });
  }
  if (tx.status === "success") {
    return NextResponse.json({ ok: true, note: "already processed" });
  }
  if (Number(body.amount) !== tx.amount) {
    return NextResponse.json({ error: "Nominal tidak sesuai" }, { status: 400 });
  }

  let confirmed;
  try {
    confirmed = await getPakasirTransactionDetail(body.order_id, tx.amount);
  } catch {
    return NextResponse.json({ error: "Gagal verifikasi ke Pakasir" }, { status: 502 });
  }
  if (!confirmed || confirmed.status !== "completed") {
    return NextResponse.json({ ok: true, note: "not completed yet" });
  }

  const { data: profile } = await admin.from("profiles").select("balance").eq("id", tx.user_id).maybeSingle();
  if (profile) {
    await admin.from("profiles").update({ balance: profile.balance + tx.amount }).eq("id", tx.user_id);
  }
  await admin.from("wallet_transactions").update({ status: "success" }).eq("id", tx.id);

  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.order_id || typeof body.amount !== "number") {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Wallet top-up confirmations use a "WT-{wallet_transactions.id}" order_id
  // so we can tell them apart from regular order payments here.
  if (typeof body.order_id === "string" && body.order_id.startsWith("WT-")) {
    return handleWalletTopup(admin, body);
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, total, coin_used, voucher_id, payment_status, status")
    .eq("order_number", body.order_id)
    .maybeSingle();

  if (!order) {
    // Return 200 anyway — Pakasir retries on non-2xx, and a stale/foreign order_id will never resolve.
    return NextResponse.json({ ok: true, note: "order not found" });
  }

  // Idempotency — Pakasir (and our own retries) may deliver this more than once.
  if (order.payment_status === "success") {
    return NextResponse.json({ ok: true, note: "already processed" });
  }

  if (Number(body.amount) !== order.total) {
    return NextResponse.json({ error: "Nominal tidak sesuai" }, { status: 400 });
  }

  // Pakasir's own docs recommend not trusting the webhook payload alone —
  // double-check directly against their transaction detail endpoint.
  let confirmed;
  try {
    confirmed = await getPakasirTransactionDetail(body.order_id, order.total);
  } catch {
    return NextResponse.json({ error: "Gagal verifikasi ke Pakasir" }, { status: 502 });
  }

  if (!confirmed || confirmed.status !== "completed") {
    return NextResponse.json({ ok: true, note: "not completed yet" });
  }

  // Mark the order paid
  await admin
    .from("orders")
    .update({
      status: "paid",
      payment_status: "success",
      payment_reference: confirmed.payment_method,
      paid_at: confirmed.completed_at ?? new Date().toISOString(),
    })
    .eq("id", order.id);

  const { data: orderItems } = await admin
    .from("order_items")
    .select("id, product_id, product_type, quantity")
    .eq("order_id", order.id);

  for (const item of orderItems ?? []) {
    const { data: product } = await admin
      .from("products")
      .select("download_limit_days, stock, sold_count")
      .eq("id", item.product_id)
      .maybeSingle();
    if (!product) continue;

    if (item.product_type === "digital") {
      const downloadExpiresAt = product.download_limit_days
        ? new Date(Date.now() + product.download_limit_days * 86_400_000).toISOString()
        : null;
      await admin.from("order_items").update({ download_expires_at: downloadExpiresAt }).eq("id", item.id);
      await admin
        .from("products")
        .update({ sold_count: (product.sold_count ?? 0) + item.quantity })
        .eq("id", item.product_id);
    } else {
      await admin
        .from("products")
        .update({
          stock: Math.max((product.stock ?? 0) - item.quantity, 0),
          sold_count: (product.sold_count ?? 0) + item.quantity,
        })
        .eq("id", item.product_id);
    }
  }

  // Voucher redemption bookkeeping
  if (order.voucher_id) {
    const { data: voucher } = await admin
      .from("vouchers")
      .select("used_count")
      .eq("id", order.voucher_id)
      .maybeSingle();
    if (voucher) {
      await admin
        .from("vouchers")
        .update({ used_count: voucher.used_count + 1 })
        .eq("id", order.voucher_id);
    }
    await admin.from("voucher_redemptions").insert({
      voucher_id: order.voucher_id,
      user_id: order.user_id,
      order_id: order.id,
    });
  }

  // Coin spend bookkeeping — only actually deducted now that payment is confirmed
  if (order.coin_used > 0) {
    const { data: profile } = await admin.from("profiles").select("coin").eq("id", order.user_id).maybeSingle();
    if (profile) {
      await admin
        .from("profiles")
        .update({ coin: Math.max(profile.coin - order.coin_used, 0) })
        .eq("id", order.user_id);
      await admin.from("coin_ledger").insert({
        user_id: order.user_id,
        amount: -order.coin_used,
        reason: "order_payment",
      });
    }
  }

  // Referral reward — grant once, on the buyer's first completed order
  const { data: referral } = await admin
    .from("referrals")
    .select("id, referrer_id, reward_granted")
    .eq("referee_id", order.user_id)
    .maybeSingle();

  if (referral && !referral.reward_granted) {
    const { count } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", order.user_id)
      .eq("payment_status", "success");

    if ((count ?? 0) <= 1) {
      const { data: settings } = await admin.from("referral_settings").select("*").eq("id", 1).maybeSingle();
      if (settings) {
        const { data: referrerProfile } = await admin
          .from("profiles")
          .select("coin, balance")
          .eq("id", referral.referrer_id)
          .maybeSingle();
        if (referrerProfile) {
          await admin
            .from("profiles")
            .update({
              coin: referrerProfile.coin + settings.reward_coin,
              balance: referrerProfile.balance + settings.reward_balance,
            })
            .eq("id", referral.referrer_id);
          if (settings.reward_coin > 0) {
            await admin.from("coin_ledger").insert({
              user_id: referral.referrer_id,
              amount: settings.reward_coin,
              reason: "referral",
            });
          }
          if (settings.reward_balance > 0) {
            await admin.from("wallet_transactions").insert({
              user_id: referral.referrer_id,
              type: "referral_bonus",
              amount: settings.reward_balance,
              note: "Bonus referral",
            });
          }
        }
        await admin.from("referrals").update({ reward_granted: true }).eq("id", referral.id);
      }
    }
  }

  await admin.from("audit_logs").insert({
    action: "order_paid",
    entity: "orders",
    entity_id: order.id,
    meta: { payment_method: confirmed.payment_method, amount: body.amount },
  });

  return NextResponse.json({ ok: true });
}
