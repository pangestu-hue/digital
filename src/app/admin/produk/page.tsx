import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export default async function AdminProductsPage() {
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, name, type, price, stock, status, sold_count")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Produk</h1>
        <Link href="/admin/produk/baru" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          + Tambah Produk
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Nama</th>
              <th className="p-3">Tipe</th>
              <th className="p-3">Harga</th>
              <th className="p-3">Stok</th>
              <th className="p-3">Terjual</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.type === "digital" ? "Digital" : "Fisik"}</td>
                <td className="p-3">{formatIDR(p.price)}</td>
                <td className="p-3">{p.type === "physical" ? p.stock : "—"}</td>
                <td className="p-3">{p.sold_count}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.status === "published"
                        ? "bg-accent/10 text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="space-x-3 p-3 text-right">
                  <Link href={`/admin/produk/${p.id}`} className="text-xs text-primary hover:underline">
                    Edit
                  </Link>
                  <DeleteProductButton id={p.id} name={p.name} />
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Belum ada produk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
