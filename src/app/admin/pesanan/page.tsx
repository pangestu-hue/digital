import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
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

export default async function AdminOrdersPage() {
  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, total, status, payment_status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Pesanan</h1>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">No. Pesanan</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3 font-mono">{o.order_number}</td>
                <td className="p-3">{formatIDR(o.total)}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      o.payment_status === "success" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("id-ID")}
                </td>
                <td className="p-3 text-right">
                  <Link href={`/admin/pesanan/${o.id}`} className="text-xs text-primary hover:underline">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Belum ada pesanan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
