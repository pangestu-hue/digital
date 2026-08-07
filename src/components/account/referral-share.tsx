"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReferralShare({ referralCode }: { referralCode: string }) {
  const [copied, setCopied] = useState(false);
  const link =
    typeof window !== "undefined" ? `${window.location.origin}/register?ref=${referralCode}` : "";

  function handleCopy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">Kode referral kamu</p>
      <p className="font-display text-2xl font-semibold text-primary">{referralCode}</p>
      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={link}
          className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-xs"
        />
        <Button onClick={handleCopy} className="w-auto flex-shrink-0">
          {copied ? "Tersalin ✓" : "Salin Link"}
        </Button>
      </div>
    </div>
  );
}
