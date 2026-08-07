import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/akun", label: "Profil" },
  { href: "/akun/pesanan", label: "Riwayat Pesanan" },
  { href: "/akun/wishlist", label: "Wishlist" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/akun");

  return (
    <main className="container max-w-3xl py-8">
      <nav className="mb-6 flex gap-4 border-b border-border">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}
