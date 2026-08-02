import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const finalPrice =
    product.discount_percent > 0
      ? Math.round(product.price * (1 - product.discount_percent / 100))
      : product.price;

  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.cover_image ? (
          <Image
            src={product.cover_image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {product.discount_percent > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            -{product.discount_percent}%
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 font-display text-sm font-medium leading-snug">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-primary">
            {formatIDR(finalPrice)}
          </span>
          {product.discount_percent > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              {formatIDR(product.price)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-secondary text-secondary" />
          <span>{product.rating_avg.toFixed(1)}</span>
          <span>· Terjual {product.sold_count}</span>
        </div>
      </div>
    </Link>
  );
}
