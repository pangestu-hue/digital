"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/google-button";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const referralCode = params.get("ref") ?? undefined;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, referralCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registrasi gagal");
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container flex min-h-[80vh] max-w-md flex-col justify-center py-12">
      <h1 className="mb-1 font-display text-2xl font-semibold">Buat akun</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Daftar untuk mulai belanja di SAUMA SHOP.
        {referralCode && <span className="block text-accent">Kode referral: {referralCode}</span>}
      </p>

      <GoogleButton />
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        atau daftar dengan email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Username</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Memproses..." : "Daftar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
