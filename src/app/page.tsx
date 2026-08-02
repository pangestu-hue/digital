import { getActiveBanners, getCategories, getProducts } from "@/lib/queries";
import { ProductCard } from "@/components/product/product-card";

export default async function HomePage() {
  const [banners, categories, latest, bestSellers] = await Promise.all([
    getActiveBanners(),
    getCategories(),
    getProducts({ orderBy: "created_at", limit: 8 }),
    getProducts({ orderBy: "sold_count", limit: 8 }),
  ]);

  return (
    <main>
      {/* Hero / Banner */}
      <section className="border-b border-border bg-muted/40">
        <div className="container py-8">
          {banners.length > 0 ? (
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl bg-muted">
              {/* Carousel wiring (embla + autoplay 8s) plugs in here */}
              <img
                src={banners[0].media_url}
                alt={banners[0].title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
                <h1 className="font-display text-2xl font-semibold md:text-3xl">
                  {banners[0].title}
                </h1>
                {banners[0].subtitle && <p className="mt-1 opacity-90">{banners[0].subtitle}</p>}
              </div>
            </div>
          ) : (
            <div className="flex aspect-[21/9] items-center justify-center rounded-xl bg-muted text-muted-foreground">
              Belum ada banner aktif
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-8">
        <h2 className="mb-4 font-display text-lg font-semibold">Kategori</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`/kategori/${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-lg border border-border p-3 text-center transition-colors hover:border-primary"
            >
              <span className="text-sm font-medium">{c.name}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Produk Terbaru */}
      <section className="container py-8">
        <h2 className="mb-4 font-display text-lg font-semibold">Produk Terbaru</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Produk Terlaris */}
      <section className="container py-8">
        <h2 className="mb-4 font-display text-lg font-semibold">Produk Terlaris</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
