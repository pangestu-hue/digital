"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { createClient } from "@/lib/supabase/client";

export function SiteHeader() {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(Boolean(data.user)));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(Boolean(session?.user)));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold text-primary">
          SAUMA SHOP
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/keranjang" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <Link href={loggedIn ? "/akun" : "/login"}>
            <User className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
