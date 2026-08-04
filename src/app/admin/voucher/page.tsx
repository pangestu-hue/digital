import { createAdminClient } from "@/lib/supabase/server";
import { VoucherManager } from "@/components/admin/voucher-manager";

export default async function AdminVouchersPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("vouchers").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Voucher</h1>
      <VoucherManager initial={data ?? []} />
    </div>
  );
}
