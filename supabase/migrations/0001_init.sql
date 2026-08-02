-- =========================================================
-- SAUMA SHOP — initial schema
-- =========================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
create type user_role as enum ('customer', 'admin', 'super_admin');
create type product_type as enum ('digital', 'physical');
create type order_status as enum (
  'pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded'
);
create type payment_status as enum ('pending', 'success', 'failed', 'expired');
create type wallet_tx_type as enum ('topup', 'purchase', 'withdrawal', 'refund', 'referral_bonus');
create type discount_type as enum ('percentage', 'fixed');

-- ---------- PROFILES (extends auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text unique not null,
  avatar_url text,
  role user_role not null default 'customer',
  balance bigint not null default 0,        -- wallet saldo, in rupiah (integer, no decimals)
  coin bigint not null default 0,
  referral_code text unique not null default substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
  referred_by uuid references public.profiles(id),
  last_checkin_at date,
  checkin_streak int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- CATEGORIES ----------
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid references public.categories(id),
  name text not null,
  slug text unique not null,
  icon text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id),
  seller_id uuid references public.profiles(id),
  type product_type not null,
  name text not null,
  slug text unique not null,
  description text,
  specification jsonb default '{}',
  price bigint not null,
  discount_percent numeric(5,2) default 0,
  stock int default 0,                       -- null-relevant for physical only; digital ignores or unlimited
  weight_grams int,                           -- physical only
  dimensions jsonb,                           -- { l, w, h } cm — physical only
  sku text,
  tags text[] default '{}',
  cover_image text,
  gallery text[] default '{}',
  video_url text,
  digital_file_path text,                     -- storage path, private bucket
  download_limit_days int,                    -- null = unlimited
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  sold_count int not null default 0,
  status text not null default 'draft',       -- draft | published | archived
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_category on public.products(category_id);
create index idx_products_status on public.products(status);
create index idx_products_tags on public.products using gin(tags);

-- ---------- BANNERS ----------
create table public.banners (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text,
  description text,
  media_url text not null,
  media_type text not null default 'image',   -- image | video
  button_label text,
  link_url text,
  priority int not null default 0,
  start_at timestamptz not null default now(),
  end_at timestamptz,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- ADDRESSES (physical products) ----------
create table public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  province text not null,
  city text not null,
  district text not null,
  postal_code text not null,
  full_address text not null,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- VOUCHERS ----------
create table public.vouchers (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  scope text not null default 'all',          -- all | category | product
  category_id uuid references public.categories(id),
  product_id uuid references public.products(id),
  discount_type discount_type not null,
  discount_value numeric(12,2) not null,
  min_purchase bigint not null default 0,
  quota int,
  used_count int not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.voucher_redemptions (
  id uuid primary key default uuid_generate_v4(),
  voucher_id uuid not null references public.vouchers(id),
  user_id uuid not null references public.profiles(id),
  order_id uuid,
  redeemed_at timestamptz not null default now(),
  unique (voucher_id, user_id, order_id)
);

-- ---------- COIN SYSTEM ----------
create table public.coin_settings (
  id int primary key default 1,
  daily_coin int not null default 10,
  min_coin_redeem int not null default 100,
  coin_to_idr_rate numeric(10,4) not null default 1, -- 1 coin = X rupiah of voucher value
  constraint single_row check (id = 1)
);
insert into public.coin_settings (id) values (1);

create table public.coin_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,                        -- positive = earn, negative = spend
  reason text not null,                       -- checkin | redeem_voucher | admin_adjust | referral
  created_at timestamptz not null default now()
);

-- ---------- REFERRAL ----------
create table public.referral_settings (
  id int primary key default 1,
  reward_coin int not null default 50,
  reward_balance bigint not null default 0,
  target_referrals int not null default 1,
  target_purchase_count int not null default 1,
  constraint single_row check (id = 1)
);
insert into public.referral_settings (id) values (1);

create table public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references public.profiles(id),
  referee_id uuid not null references public.profiles(id) unique,
  reward_granted boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- WALLET ----------
create table public.wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type wallet_tx_type not null,
  amount bigint not null,                     -- positive = credit, negative = debit
  reference_id uuid,                          -- order id / withdrawal id
  status text not null default 'success',
  note text,
  created_at timestamptz not null default now()
);

create table public.wallet_settings (
  id int primary key default 1,
  admin_fee_percent numeric(5,2) not null default 0,
  min_withdrawal bigint not null default 50000,
  min_topup bigint not null default 10000,
  constraint single_row check (id = 1)
);
insert into public.wallet_settings (id) values (1);

-- ---------- ORDERS ----------
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null default 'SS-' || to_char(now(), 'YYMMDD') || '-' || substr(replace(uuid_generate_v4()::text,'-',''),1,6),
  user_id uuid not null references public.profiles(id),
  status order_status not null default 'pending',
  payment_status payment_status not null default 'pending',
  payment_method text default 'pakasir',
  payment_reference text,
  subtotal bigint not null,
  discount_amount bigint not null default 0,
  coin_used int not null default 0,
  admin_fee bigint not null default 0,
  shipping_fee bigint not null default 0,
  total bigint not null,
  voucher_id uuid references public.vouchers(id),
  address_id uuid references public.addresses(id),  -- physical only
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,     -- snapshot at purchase time
  product_type product_type not null,
  unit_price bigint not null,
  quantity int not null default 1,
  subtotal bigint not null,
  download_expires_at timestamptz  -- digital only, computed from product.download_limit_days
);

-- ---------- REVIEWS ----------
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_item_id uuid references public.order_items(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  images text[] default '{}',
  created_at timestamptz not null default now(),
  unique (order_item_id)
);

-- ---------- WISHLIST ----------
create table public.wishlist (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------- AUDIT LOG ----------
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb default '{}',
  created_at timestamptz not null default now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.banners enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.addresses enable row level security;
alter table public.vouchers enable row level security;
alter table public.voucher_redemptions enable row level security;
alter table public.coin_ledger enable row level security;
alter table public.referrals enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;
alter table public.audit_logs enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

-- Profiles: user reads/updates own row; admins read all
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Public catalog: anyone can read published products/categories/banners
create policy "products_public_read" on public.products
  for select using (status = 'published' or public.is_admin());
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "categories_public_read" on public.categories
  for select using (is_active = true or public.is_admin());
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "banners_public_read" on public.banners
  for select using (is_published = true or public.is_admin());
create policy "banners_admin_write" on public.banners
  for all using (public.is_admin()) with check (public.is_admin());

-- Orders: user sees own orders; admin sees all
create policy "orders_own_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin());

create policy "order_items_via_order" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );

-- Addresses: owner only
create policy "addresses_own" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Vouchers: public can read active ones; admin manages
create policy "vouchers_public_read" on public.vouchers
  for select using (is_active = true or public.is_admin());
create policy "vouchers_admin_write" on public.vouchers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "voucher_redemptions_own" on public.voucher_redemptions
  for select using (auth.uid() = user_id or public.is_admin());

-- Coin ledger: owner + admin
create policy "coin_ledger_own_or_admin" on public.coin_ledger
  for select using (auth.uid() = user_id or public.is_admin());

-- Referrals: participant + admin
create policy "referrals_participant_or_admin" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referee_id or public.is_admin());

-- Wallet: owner + admin
create policy "wallet_tx_own_or_admin" on public.wallet_transactions
  for select using (auth.uid() = user_id or public.is_admin());

-- Reviews: public read; owner writes own; admin manages
create policy "reviews_public_read" on public.reviews
  for select using (true);
create policy "reviews_owner_write" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "reviews_owner_update" on public.reviews
  for update using (auth.uid() = user_id);
create policy "reviews_admin_delete" on public.reviews
  for delete using (public.is_admin());

-- Wishlist: owner only
create policy "wishlist_own" on public.wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Audit logs: admin only
create policy "audit_logs_admin_only" on public.audit_logs
  for select using (public.is_admin());

-- =========================================================
-- TRIGGERS
-- =========================================================

-- auto-create profile row when a new auth.users row appears
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger trg_products_updated_at before update on public.products
  for each row execute procedure public.set_updated_at();
create trigger trg_orders_updated_at before update on public.orders
  for each row execute procedure public.set_updated_at();
