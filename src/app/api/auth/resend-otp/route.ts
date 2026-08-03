import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { createAndStoreOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/brevo";

const schema = z.object({
  email: z.string().email(),
  purpose: z.enum(["verify_email", "reset_password"]),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  const { email, purpose } = parsed.data;
  const admin = createAdminClient();

  // Always respond ok (don't leak whether an email is registered) except we
  // genuinely skip sending if there's no such account.
  const { data: profile } = await admin
    .from("profiles")
    .select("id, is_verified")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ ok: true });
  }
  if (purpose === "verify_email" && profile.is_verified) {
    return NextResponse.json({ ok: true });
  }

  const { code, expiresInMinutes } = await createAndStoreOtp(email, purpose);
  await sendOtpEmail({ to: email, code, purpose, expiresInMinutes });

  return NextResponse.json({ ok: true });
}
