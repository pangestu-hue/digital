import { createAdminClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/utils";

async function getStats() {
  const admin = createAdminClient();

  const [{ count: productCount }, { count: userCount }, { count: orderCount }, { data: paidOrders }] =
    await Promise.all([
      admin.from("products").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("orders").select("id", { count: "exact", head: true }),
      admin.from("orders").select("total").eq("payment_status", "success"),
    ]);

  const revenue = (paidOrders ?? []).reduce((sum, o) => sum + o.total, 0);

  return {
    productCount: productCount ?? 0,
    userCount: userCount ?? 0,
    orderCount: orderCount ?? 0,
    revenue,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total Pendapatan", value: formatIDR(stats.revenue) },
    { label: "Total Pesanan", value: stats.orderCount },
    { label: "Total Produk", value: stats.productCount },
    { label: "Total User", value: stats.userCount },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
