"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [coinBalance, setCoinBalance] = useState(0);
  const [useCoin, setUseCoin] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [address, setAddress] = useState({
    recipient_name: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    postal_code: "",
    full_address: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasPhysical = items.some((i) => i.product.type === "physical");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("coin").eq("id", user.id).maybeSingle();
      if (data) setCoinBalance(data.coin);
    })();
  }, []);

  async function handleSubmit() {
    setError(null);
    if (hasPhysical) {
      const required = ["recipient_name", "phone", "province", "city", "district", "postal_code", "full_address"];
      for (const field of required) {
        if (!address[field as keyof typeof address]) {
          setError("Lengkapi alamat pengiriman terlebih dahulu");
          return;
        }
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
          voucherCode: voucherCode || undefined,
          useCoin,
          address: hasPhysical ? address : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat pesanan");

      clear();
      if (data.free || !data.paymentUrl) {
        router.push(`/pesanan/${data.orderNumber}`);
      } else {
        window.location.href = data.paymentUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="container flex min-h-[60vh] items-center justify-center py-12 text-center text-muted-foreground">
        Keranjang kosong.
      </main>
    );
  }

  return (
    <main className="container max-w-2xl py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold">Checkout</h1>

      <section className="mb-6 space-y-2 rounded-lg border border-border p-4">
        {items.map(({ product, quantity }) => {
          const price =
            product.discount_percent > 0
              ? Math.round(product.price * (1 - product.discount_percent / 100))
              : product.price;
          return (
            <div key={product.id} className="flex justify-between text-sm">
              <span>
                {product.name} × {quantity}
              </span>
              <span>{formatIDR(price * quantity)}</span>
            </div>
          );
        })}
      </section>

      {hasPhysical && (
        <section className="mb-6 space-y-3 rounded-lg border border-border p-4">
          <h2 className="font-display font-semibold">Alamat Pengiriman</h2>
          <Input
            placeholder="Nama penerima"
            value={address.recipient_name}
            onChange={(e) => setAddress({ ...address, recipient_name: e.target.value })}
          />
          <Input
            placeholder="Nomor HP"
            value={address.phone}
            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Provinsi"
              value={address.province}
              onChange={(e) => setAddress({ ...address, province: e.target.value })}
            />
            <Input
              placeholder="Kota"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Kecamatan"
              value={address.district}
              onChange={(e) => setAddress({ ...address, district: e.target.value })}
            />
            <Input
              placeholder="Kode pos"
              value={address.postal_code}
              onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
            />
          </div>
          <Input
            placeholder="Alamat lengkap"
            value={address.full_address}
            onChange={(e) => setAddress({ ...address, full_address: e.target.value })}
          />
          <Input
            placeholder="Catatan (opsional)"
            value={address.notes}
            onChange={(e) => setAddress({ ...address, notes: e.target.value })}
          />
        </section>
      )}

      <section className="mb-6 space-y-3 rounded-lg border border-border p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Kode Voucher</label>
          <Input
            placeholder="Contoh: SAUMA10"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
          />
        </div>
        {coinBalance > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={useCoin} onChange={(e) => setUseCoin(e.target.checked)} />
            Pakai koin ({coinBalance} koin tersedia)
          </label>
        )}
      </section>

      <div className="mb-4 flex items-center justify-between">
        <span className="font-medium">Subtotal</span>
        <span className="font-display text-lg font-semibold">{formatIDR(subtotal)}</span>
      </div>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Memproses..." : "Bayar Sekarang"}
      </Button>
    </main>
  );
}
