const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface SendOtpEmailParams {
  to: string;
  code: string;
  purpose: "verify_email" | "reset_password" | "change_email";
  expiresInMinutes: number;
}

const SUBJECTS: Record<SendOtpEmailParams["purpose"], string> = {
  verify_email: "Kode verifikasi akun SAUMA SHOP",
  reset_password: "Kode reset password SAUMA SHOP",
  change_email: "Kode verifikasi perubahan email SAUMA SHOP",
};

const HEADLINES: Record<SendOtpEmailParams["purpose"], string> = {
  verify_email: "Verifikasi akun kamu",
  reset_password: "Reset password kamu",
  change_email: "Verifikasi email baru kamu",
};

export async function sendOtpEmail({ to, code, purpose, expiresInMinutes }: SendOtpEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY is not configured");

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL ?? "noreply@patimah-sthore.shop",
        name: process.env.BREVO_SENDER_NAME ?? "SAUMA SHOP",
      },
      to: [{ email: to }],
      subject: SUBJECTS[purpose],
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#7a2a1e;">${HEADLINES[purpose]}</h2>
          <p>Kode verifikasi kamu:</p>
          <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color:#111;">${code}</p>
          <p>Kode ini berlaku selama <strong>${expiresInMinutes} menit</strong>. Jangan bagikan kode ini ke siapa pun, termasuk pihak yang mengaku sebagai admin SAUMA SHOP.</p>
          <p style="color:#888; font-size:12px;">Kalau kamu tidak meminta ini, abaikan saja email ini.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo send failed (${res.status}): ${body}`);
  }
}
