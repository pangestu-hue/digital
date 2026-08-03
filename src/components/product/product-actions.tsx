"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

export function ProductActions({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const outOfStock = product.type === "physical" && (product.stock ?? 0) <= 0;

  function handleAddToCart() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    addItem(product);
    router.push("/checkout");
  }

  if (outOfStock) {
    return (
      <Button disabled variant="outline">
        Stok habis
      </Button>
    );
  }

  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={handleAddToCart}>
        {added ? "Ditambahkan ✓" : "Tambah Keranjang"}
      </Button>
      <Button onClick={handleBuyNow}>Beli Sekarang</Button>
    </div>
  );
}
