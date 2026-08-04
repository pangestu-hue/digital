import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*, order_items(*), addresses(*), profiles!orders_user_id_fkey(username, email)")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-display text-2xl font-semibold">Pesanan #{order.order_number}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {order.profiles?.username} · {order.profiles?.email}
      </p>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium">Status:</span>
        <OrderStatusSelect orderId={order.id} current={order.status} />
        <span className="text-xs text-muted-foreground">
          Pembayaran: {order.payment_status === "success" ? "Berhasil" : order.payment_status}
        </span>
      </div>

      <div className="mb-6 space-y-2 rounded-lg border border-border p-4">
        {order.order_items.map((item: any) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.product_name} × {item.quantity}
            </span>
            <span>{formatIDR(item.subtotal)}</span>
          </div>
        ))}
        <div className="border-t border-border pt-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatIDR(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Diskon voucher</span>
              <span>-{formatIDR(order.discount_amount)}</span>
            </div>
          )}
          {order.coin_used > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Koin dipakai</span>
              <span>-{order.coin_used}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatIDR(order.total)}</span>
          </div>
        </div>
      </div>

      {order.addresses && (
        <div className="rounded-lg border border-border p-4 text-sm">
          <h2 className="mb-2 font-display font-semibold">Alamat Pengiriman</h2>
          <p>{order.addresses.recipient_name}</p>
          <p>{order.addresses.phone}</p>
          <p>
            {order.addresses.full_address}, {order.addresses.district}, {order.addresses.city},{" "}
            {order.addresses.province} {order.addresses.postal_code}
          </p>
          {order.addresses.notes && <p className="text-muted-foreground">Catatan: {order.addresses.notes}</p>}
        </div>
      )}
    </div>
  );
}
