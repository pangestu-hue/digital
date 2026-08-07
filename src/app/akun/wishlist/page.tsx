import { createClient } from "@/lib/supabase/server";
import { WishlistGrid } from "@/components/account/wishlist-grid";

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("wishlist")
    .select("product_id, products(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const items = (data ?? [])
    .filter((row: any) => row.products)
    .map((row: any) => ({ ...row.products, wishlistRowId: row.product_id }));

  return <WishlistGrid initial={items} />;
}
