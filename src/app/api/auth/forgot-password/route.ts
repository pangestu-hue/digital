import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { createAndStoreOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/brevo";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
  }
  const { email } = parsed.data;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  // Same response either way so we don't reveal which emails are registered
  if (profile) {
    const { code, expiresInMinutes } = await createAndStoreOtp(email, "reset_password");
    await sendOtpEmail({ to: email, code, purpose: "reset_password", expiresInMinutes });
  }

  return NextResponse.json({ ok: true });
}
