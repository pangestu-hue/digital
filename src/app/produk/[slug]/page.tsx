import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { formatIDR } from "@/lib/utils";
import { ProductActions } from "@/components/product/product-actions";
import { WishlistButton } from "@/components/product/wishlist-button";
import { ProductCard } from "@/components/product/product-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produk tidak ditemukan" };
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: product.name,
      images: product.cover_image ? [product.cover_image] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category_id, product.id);
  const finalPrice =
    product.discount_percent > 0
      ? Math.round(product.price * (1 - product.discount_percent / 100))
      : product.price;

  return (
    <main className="container py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl bg-muted">
            {product.cover_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.cover_image} alt={product.name} className="h-full w-full object-cover" />
            )}
          </div>
          {product.gallery?.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.gallery.slice(0, 4).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt="" className="aspect-square rounded-md object-cover" />
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.type === "digital" ? "Produk Digital" : "Produk Fisik"}
          </span>
          <h1 className="mt-1 font-display text-2xl font-semibold">{product.name}</h1>

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-secondary text-secondary" />
            <span>{product.rating_avg.toFixed(1)}</span>
            <span>({product.rating_count} ulasan)</span>
            <span>·</span>
            <span>Terjual {product.sold_count}</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold text-primary">
              {formatIDR(finalPrice)}
            </span>
            {product.discount_percent > 0 && (
              <>
                <span className="text-muted-foreground line-through">{formatIDR(product.price)}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  -{product.discount_percent}%
                </span>
              </>
            )}
          </div>

          {product.type === "physical" && (
            <p className="mt-2 text-sm text-muted-foreground">Stok: {product.stock ?? 0}</p>
          )}

          <div className="mt-6 flex gap-3">
            <ProductActions product={product} />
            <WishlistButton productId={product.id} />
          </div>

          {product.description && (
            <div className="mt-8">
              <h2 className="mb-2 font-display text-lg font-semibold">Deskripsi</h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
            </div>
          )}

          {product.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-lg font-semibold">Produk Terkait</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
