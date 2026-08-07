"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types";

export function WishlistGrid({ initial }: { initial: (Product & { wishlistRowId: string })[] }) {
  const [items, setItems] = useState(initial);

  async function handleRemove(productId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
    setItems((prev) => prev.filter((p) => p.id !== productId));
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground">Belum ada produk di wishlist.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((product) => (
        <div key={product.id} className="relative">
          <ProductCard product={product} />
          <button
            onClick={() => handleRemove(product.id)}
            className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-1 text-xs shadow"
          >
            Hapus
          </button>
        </div>
      ))}
    </div>
  );
}
