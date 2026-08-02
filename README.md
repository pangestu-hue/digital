# SAUMA SHOP

Marketplace produk digital & fisik. Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase.

## Status scaffold ini

Sudah ada:
- Struktur project Next.js 15 App Router (`src/app`, `src/components`, `src/lib`, `src/types`)
- Design token (warna, tipografi) di `src/app/globals.css` + `tailwind.config.ts`
- Supabase client (browser, server, admin/service-role) di `src/lib/supabase/`
- Middleware auth-gate untuk `/admin` dan `/checkout`
- Skema database lengkap: `supabase/migrations/0001_init.sql`
  - profiles, categories, products, banners, addresses, vouchers, coin, referral, wallet, orders, order_items, reviews, wishlist, audit_logs
  - Row Level Security untuk semua tabel
  - Trigger auto-create profile saat user baru daftar
- Storage buckets: `supabase/migrations/0002_storage.sql`
  - `product-images`, `avatars`, `banners` (public), `digital-products` (private, signed URL saja)
- Halaman utama (`src/app/page.tsx`) dengan hero banner, kategori, produk terbaru, produk terlaris
- `ProductCard` component

Belum ada (langkah berikutnya):
- Halaman login/registrasi + OTP Brevo
- Detail produk, keranjang, checkout
- Integrasi Pakasir payment
- Admin panel
- Sistem voucher/coin/referral/wallet di sisi UI (schema sudah siap)

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # isi kredensial Supabase, Brevo, Pakasir
npm run dev
```

## Setup Supabase

1. Buat project baru di organisasi **pangestu**.
2. Jalankan migrasi:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
3. Aktifkan provider **Google OAuth** di Authentication → Providers.
4. Salin `Project URL` dan `anon key` ke `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), dan `service_role key` ke `SUPABASE_SERVICE_ROLE_KEY` (jangan pernah expose ke client).

## Setup Brevo (OTP)

1. Buat API key di Brevo → SMTP & API.
2. Isi `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` di `.env.local`.
3. OTP disimpan sementara (misalnya di tabel terpisah atau Supabase Edge Function) dengan masa berlaku `OTP_EXPIRY_MINUTES`.

## Setup Pakasir

1. Ambil API key, slug, dan secret dari dashboard Pakasir.
2. Isi di `.env.local`. Semua request ke API Pakasir dilakukan dari server (route handler), tidak pernah dari client.

## Deploy

- **Vercel**: import repo, set Root Directory ke folder project ini, isi seluruh Environment Variables dari `.env.example`.
- **Cloudflare**: arahkan domain `patimah-sthore.shop` (CNAME/A record sesuai instruksi Vercel), aktifkan proxy jika ingin WAF/rate-limit Cloudflare.
- **GitHub**: repo `digital` — push scaffold ini sebagai commit awal.

## Struktur folder

```
src/
  app/            # routes (App Router)
  components/     # ui/, layout/, product/, home/
  lib/            # supabase clients, queries, utils
  types/          # domain types + generated database types
supabase/
  migrations/     # SQL schema, RLS, storage policies
```
