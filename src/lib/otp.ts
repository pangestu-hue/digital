import { createHash, randomInt } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES ?? 10);
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "verify_email" | "reset_password" | "change_email";

function hashCode(code: string, email: string) {
  // Salted with email + server secret so a leaked DB row alone isn't enough to replay.
  return createHash("sha256")
    .update(`${code}:${email.toLowerCase()}:${process.env.JWT_SECRET ?? ""}`)
    .digest("hex");
}

export function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export async function createAndStoreOtp(email: string, purpose: OtpPurpose) {
  const admin = createAdminClient();
  const code = generateOtp();
  const code_hash = hashCode(code, email);
  const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000).toISOString();

  // Invalidate any previous outstanding codes of the same purpose for this email
  await admin
    .from("otp_codes")
    .update({ consumed: true })
    .eq("email", email.toLowerCase())
    .eq("purpose", purpose)
    .eq("consumed", false);

  const { error } = await admin.from("otp_codes").insert({
    email: email.toLowerCase(),
    code_hash,
    purpose,
    expires_at,
  });
  if (error) throw error;

  return { code, expiresInMinutes: OTP_EXPIRY_MINUTES };
}

export async function verifyOtp(email: string, purpose: OtpPurpose, code: string) {
  const admin = createAdminClient();
  const code_hash = hashCode(code, email);

  const { data: rows, error } = await admin
    .from("otp_codes")
    .select("id, code_hash, attempts, consumed, expires_at")
    .eq("email", email.toLowerCase())
    .eq("purpose", purpose)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !rows || rows.length === 0) {
    return { valid: false, reason: "not_found" as const };
  }

  const row = rows[0];

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { valid: false, reason: "expired" as const };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { valid: false, reason: "too_many_attempts" as const };
  }

  if (row.code_hash !== code_hash) {
    await admin.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    return { valid: false, reason: "mismatch" as const };
  }

  await admin.from("otp_codes").update({ consumed: true }).eq("id", row.id);
  return { valid: true as const };
}
