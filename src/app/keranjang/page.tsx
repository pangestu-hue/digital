"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { Trash2, Minus, Plus } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Keranjang kamu masih kosong.</p>
        <Link href="/" className="mt-3 text-primary hover:underline">
          Mulai belanja
        </Link>
      </main>
    );
  }

  return (
    <main className="container max-w-2xl py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold">Keranjang</h1>

      <div className="space-y-4">
        {items.map(({ product, quantity }) => {
          const price =
            product.discount_percent > 0
              ? Math.round(product.price * (1 - product.discount_percent / 100))
              : product.price;
          return (
            <div key={product.id} className="flex gap-3 rounded-lg border border-border p-3">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                {product.cover_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.cover_image} alt={product.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                  <p className="text-sm font-semibold text-primary">{formatIDR(price)}</p>
                </div>
                <div className="flex items-center justify-between">
                  {product.type === "physical" ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="rounded border border-border p-1"
                        aria-label="Kurangi"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="rounded border border-border p-1"
                        aria-label="Tambah"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Produk digital · 1 unduhan</span>
                  )}
                  <button
                    onClick={() => removeItem(product.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <span className="font-medium">Subtotal</span>
        <span className="font-display text-lg font-semibold">{formatIDR(subtotal)}</span>
      </div>

      <Link href="/checkout">
        <Button className="mt-4">Checkout</Button>
      </Link>
    </main>
  );
}
