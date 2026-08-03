import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyOtp } from "@/lib/otp";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  const { email, code } = parsed.data;

  const result = await verifyOtp(email, "verify_email", code);
  if (!result.valid) {
    const messages: Record<string, string> = {
      not_found: "Kode tidak ditemukan, minta kode baru",
      expired: "Kode sudah kedaluwarsa, minta kode baru",
      too_many_attempts: "Terlalu banyak percobaan, minta kode baru",
      mismatch: "Kode salah",
    };
    return NextResponse.json({ error: messages[result.reason] ?? "Kode salah" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_verified: true })
    .eq("email", email.toLowerCase());

  if (error) {
    return NextResponse.json({ error: "Gagal memverifikasi akun" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
