"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      setTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 1200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container flex min-h-[80vh] max-w-md flex-col justify-center py-12">
      <h1 className="mb-1 font-display text-2xl font-semibold">Lupa password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Masukkan email akun kamu, kami kirim kode reset password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {sent && (
          <p className="text-sm text-accent">Kalau email terdaftar, kode sudah dikirim. Mengarahkan...</p>
        )}
        <Button type="submit" disabled={loading || sent}>
          {loading ? "Mengirim..." : "Kirim kode"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Kembali ke login
        </Link>
      </p>
    </main>
  );
}
