"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verifikasi gagal");
      router.push("/login?verified=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "verify_email" }),
      });
      setInfo("Kode baru sudah dikirim ke email kamu.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="container flex min-h-[80vh] max-w-md flex-col justify-center py-12">
      <h1 className="mb-1 font-display text-2xl font-semibold">Verifikasi email</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Kami sudah kirim kode 6 digit ke <span className="font-medium text-foreground">{email}</span>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          inputMode="numeric"
          className="text-center text-2xl tracking-[0.5em]"
          maxLength={6}
          required
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {info && <p className="text-sm text-accent">{info}</p>}
        <Button type="submit" disabled={loading || code.length !== 6}>
          {loading ? "Memverifikasi..." : "Verifikasi"}
        </Button>
        <Button type="button" variant="ghost" onClick={handleResend} disabled={resending}>
          {resending ? "Mengirim..." : "Kirim ulang kode"}
        </Button>
      </form>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpForm />
    </Suspense>
  );
}
