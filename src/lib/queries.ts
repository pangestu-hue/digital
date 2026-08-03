import { createClient } from "@/lib/supabase/server";
import type { Banner, Category, Product } from "@/types";

export async function getActiveBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("is_published", true)
    .lte("start_at", new Date().toISOString())
    .or(`end_at.is.null,end_at.gte.${new Date().toISOString()}`)
    .order("priority", { ascending: false });
  return (data as Banner[]) ?? [];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data as Category[]) ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as Product) ?? null;
}

export async function getRelatedProducts(categoryId: string | null, excludeId: string, limit = 4) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .neq("id", excludeId)
    .limit(limit);
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data } = await query;
  return (data as Product[]) ?? [];
}

export async function getProducts(opts: {
  orderBy?: "created_at" | "sold_count" | "rating_avg";
  limit?: number;
} = {}): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .order(opts.orderBy ?? "created_at", { ascending: false })
    .limit(opts.limit ?? 12);
  return (data as Product[]) ?? [];
}
