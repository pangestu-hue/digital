import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu pembayaran",
  paid: "Pembayaran berhasil",
  processing: "Sedang diproses",
  shipped: "Sedang dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Direfund",
};

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) notFound();

  const isPaid = order.payment_status === "success";

  return (
    <main className="container max-w-lg py-12">
      <div className="rounded-xl border border-border p-6 text-center">
        <p className={`text-sm font-medium ${isPaid ? "text-accent" : "text-secondary"}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold">Pesanan #{order.order_number}</h1>
        <p className="mt-4 font-display text-2xl font-semibold">{formatIDR(order.total)}</p>

        {!isPaid && (
          <p className="mt-3 text-sm text-muted-foreground">
            Kalau kamu sudah bayar tapi status belum berubah, tunggu beberapa saat — konfirmasi otomatis dari
            payment gateway biasanya masuk dalam 1-2 menit.
          </p>
        )}

        <div className="mt-6 space-y-2 text-left">
          {order.order_items.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span>{formatIDR(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {isPaid && (
          <Link href="/akun/pesanan" className="mt-6 block">
            <Button variant="outline">Lihat Riwayat Pesanan</Button>
          </Link>
        )}
      </div>
    </main>
  );
}
