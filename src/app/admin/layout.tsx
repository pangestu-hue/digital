import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/produk", label: "Produk" },
  { href: "/admin/kategori", label: "Kategori" },
  { href: "/admin/banner", label: "Banner" },
  { href: "/admin/voucher", label: "Voucher" },
  { href: "/admin/pesanan", label: "Pesanan" },
  { href: "/admin/wallet", label: "Wallet" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase.from("profiles").select("role, username").eq("id", user.id).maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 flex-shrink-0 border-r border-border bg-muted/30 p-4">
        <div className="mb-6">
          <p className="font-display text-lg font-semibold text-primary">SAUMA Admin</p>
          <p className="text-xs text-muted-foreground">{profile.username}</p>
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="mt-6 block text-xs text-muted-foreground hover:underline">
          ← Kembali ke toko
        </Link>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
