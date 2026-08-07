import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { createAndStoreOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/brevo";

const schema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, underscore"),
  email: z.string().email(),
  password: z.string().min(8, "Password minimal 8 karakter"),
  referralCode: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }
  const { username, email, password, referralCode } = parsed.data;
  const admin = createAdminClient();

  // Check username uniqueness up front for a clearer error than the DB constraint
  const { data: existingUsername } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existingUsername) {
    return NextResponse.json({ error: "Username sudah dipakai" }, { status: 409 });
  }

  // Create the auth user pre-confirmed (we gate real access via our own OTP + is_verified flag,
  // not Supabase's built-in email confirmation flow)
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (createError) {
    const isDuplicate = createError.message?.toLowerCase().includes("already");
    return NextResponse.json(
      { error: isDuplicate ? "Email sudah terdaftar" : createError.message },
      { status: isDuplicate ? 409 : 400 }
    );
  }

  if (referralCode && created?.user?.id) {
    const { data: referrer } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", referralCode.trim())
      .maybeSingle();
    if (referrer && referrer.id !== created.user.id) {
      await admin.from("profiles").update({ referred_by: referrer.id }).eq("id", created.user.id);
      await admin.from("referrals").insert({ referrer_id: referrer.id, referee_id: created.user.id });
    }
  }

  try {
    const { code, expiresInMinutes } = await createAndStoreOtp(email, "verify_email");
    await sendOtpEmail({ to: email, code, purpose: "verify_email", expiresInMinutes });
  } catch (err) {
    // Roll back the just-created auth user if we couldn't send the OTP, so the
    // person isn't left with an unverifiable account they can't re-register with.
    if (created?.user?.id) {
      await admin.auth.admin.deleteUser(created.user.id);
    }
    return NextResponse.json({ error: "Gagal mengirim kode OTP, coba lagi" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, email });
}
