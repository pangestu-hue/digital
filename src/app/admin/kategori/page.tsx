import { createAdminClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/admin/category-manager";
import type { Category } from "@/types";

export default async function AdminCategoriesPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("categories").select("*").order("sort_order");

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Kategori</h1>
      <CategoryManager initial={(data as Category[]) ?? []} />
    </div>
  );
}
