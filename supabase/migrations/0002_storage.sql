-- =========================================================
-- STORAGE BUCKETS
-- =========================================================

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('avatars', 'avatars', true),
  ('banners', 'banners', true),
  ('digital-products', 'digital-products', false)  -- private: gated by signed URLs after purchase
on conflict (id) do nothing;

-- Public read for public buckets
create policy "public_read_product_images" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "public_read_avatars" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "public_read_banners" on storage.objects
  for select using (bucket_id = 'banners');

-- Admin-only write for catalog assets
create policy "admin_write_product_images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin_update_product_images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());
create policy "admin_delete_product_images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

create policy "admin_manage_banners" on storage.objects
  for all using (bucket_id = 'banners' and public.is_admin())
  with check (bucket_id = 'banners' and public.is_admin());

-- Digital products: no direct client access — always via service-role
-- signed URL issued server-side after verifying the order/order_item is paid.
create policy "admin_manage_digital_products" on storage.objects
  for all using (bucket_id = 'digital-products' and public.is_admin())
  with check (bucket_id = 'digital-products' and public.is_admin());

-- Avatars: user manages own folder (path convention: {user_id}/filename)
create policy "user_write_own_avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "user_update_own_avatar" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
