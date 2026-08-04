import { createAdminClient } from "@/lib/supabase/server";
import { BannerManager } from "@/components/admin/banner-manager";
import type { Banner } from "@/types";

export default async function AdminBannersPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("banners").select("*").order("priority", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Banner</h1>
      <BannerManager initial={(data as Banner[]) ?? []} />
    </div>
  );
}
