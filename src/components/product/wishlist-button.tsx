"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      setWishlisted(Boolean(data));
    })();
  }, [productId]);

  async function handleToggle() {
    if (!userId) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    if (wishlisted) {
      await supabase.from("wishlist").delete().eq("user_id", userId).eq("product_id", productId);
      setWishlisted(false);
    } else {
      await supabase.from("wishlist").insert({ user_id: userId, product_id: productId });
      setWishlisted(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label="Wishlist"
      className="flex h-10 w-10 items-center justify-center rounded-md border border-border hover:border-primary"
    >
      <Heart className={cn("h-4 w-4", wishlisted && "fill-primary text-primary")} />
    </button>
  );
}
