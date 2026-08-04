import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("*").eq("id", id).maybeSingle();

  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Edit Produk</h1>
      <ProductForm
        initial={{
          ...product,
          tags: (product.tags ?? []).join(", "),
        }}
      />
    </div>
  );
}
