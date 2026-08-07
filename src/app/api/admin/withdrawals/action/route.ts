import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const schema = z.object({
  txId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  action: z.enum(["approve", "reject"]),
});

export async function POST(req: Request) {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  const { txId, userId, amount, action } = parsed.data;

  const { data: tx } = await admin.from("wallet_transactions").select("status").eq("id", txId).maybeSingle();
  if (!tx || tx.status !== "pending") {
    return NextResponse.json({ error: "Transaksi sudah diproses" }, { status: 400 });
  }

  if (action === "approve") {
    await admin.from("wallet_transactions").update({ status: "success" }).eq("id", txId);
  } else {
    // Refund the reserved balance back to the user
    const { data: targetProfile } = await admin.from("profiles").select("balance").eq("id", userId).maybeSingle();
    if (targetProfile) {
      await admin.from("profiles").update({ balance: targetProfile.balance + amount }).eq("id", userId);
    }
    await admin.from("wallet_transactions").update({ status: "failed" }).eq("id", txId);
  }

  return NextResponse.json({ ok: true });
}
