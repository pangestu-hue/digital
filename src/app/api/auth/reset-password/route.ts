import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyOtp } from "@/lib/otp";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8, "Password minimal 8 karakter"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }
  const { email, code, newPassword } = parsed.data;

  const result = await verifyOtp(email, "reset_password", code);
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
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }

  const { error } = await admin.auth.admin.updateUserById(profile.id, { password: newPassword });
  if (error) {
    return NextResponse.json({ error: "Gagal mengubah password" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
