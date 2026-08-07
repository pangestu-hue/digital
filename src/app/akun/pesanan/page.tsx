import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Pembayaran",
  paid: "Dibayar",
  processing: "Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Direfund",
};

export default async function OrderHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, total, status, payment_status, created_at, order_items(product_name, quantity)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return <p className="text-muted-foreground">Belum ada pesanan.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/pesanan/${order.order_number}`}
          className="block rounded-lg border border-border p-4 hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm">#{order.order_number}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                order.payment_status === "success" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
              }`}
            >
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {order.order_items.map((i: any) => i.product_name).join(", ")}
          </p>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString("id-ID")}
            </span>
            <span className="font-semibold">{formatIDR(order.total)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
