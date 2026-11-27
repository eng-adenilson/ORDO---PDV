-- Bucket de fotos de produtos (SPEC §3, passo 5).
-- Rode no SQL Editor do Supabase quando conectar a uma instância Supabase.
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do update set public = true;

create policy "product_photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'product-photos');

create policy "product_photos_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-photos');

create policy "product_photos_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-photos');

create policy "product_photos_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-photos');
