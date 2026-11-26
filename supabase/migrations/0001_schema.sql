-- ORDO — esquema inicial (Supabase / PostgreSQL)
-- Aplique com: supabase db push   (ou cole no SQL Editor do painel)
-- Valores monetários em CENTAVOS (bigint). Estoque em unidades inteiras (§2.1).
-- Regra central: estoque só muda por RPC (finalize_sale, cancel_sale, register_stock_entry),
-- dentro de transação com lock da linha do produto → vendas simultâneas em aparelhos diferentes
-- não deixam o saldo negativo (§1.4 / §12).

create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- ---------------------------------------------------------------- cadastros
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
  -- §13.4: demais campos do fornecedor ainda não definidos
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);
create index customers_name_trgm on public.customers using gin (name gin_trgm_ops);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                       -- único (§2.1)
  name text not null,
  category_id uuid references public.categories (id),
  description text,
  photo_url text,
  cost_cents bigint check (cost_cents >= 0),       -- nunca exposto na view de vendas
  price_cents bigint check (price_cents >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  min_stock integer check (min_stock >= 0),        -- critério de "estoque baixo" (§13.3, provisório)
  active boolean not null default true,
  search text generated always as (lower(name || ' ' || code)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_search_trgm on public.products using gin (search gin_trgm_ops);

-- Visão usada pela tela de vendas: SEM custo e SEM estoque (§2.2, §12).
create view public.sale_products with (security_invoker = true) as
  select id, code, name, photo_url, price_cents, category_id
  from public.products where active;

-- ---------------------------------------------------------------- caixa
create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid not null references public.profiles (id),
  opened_at timestamptz not null default now(),
  opening_cents bigint not null check (opening_cents >= 0),
  closed_by uuid references public.profiles (id),
  closed_at timestamptz,
  expected_cents bigint,
  counted_cents bigint,
  note text
);
-- §13.6 pendente: por ora, no máximo um caixa aberto por vez.
create unique index one_open_cash_session on public.cash_sessions ((closed_at is null)) where closed_at is null;

-- ---------------------------------------------------------------- vendas
create type public.payment_method as enum ('pix', 'dinheiro', 'credito', 'debito');
create type public.sale_status as enum ('completed', 'cancelled');
create type public.discount_type as enum ('amount', 'percent');

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  number bigserial unique,                          -- "Venda #1048"
  client_id text not null unique,                   -- gerado no aparelho: idempotência da sync offline
  seller_id uuid not null references public.profiles (id),
  customer_id uuid references public.customers (id),
  cash_session_id uuid references public.cash_sessions (id),
  payment_method public.payment_method not null,
  gross_cents bigint not null,
  discount_cents bigint not null,
  total_cents bigint not null,
  status public.sale_status not null default 'completed',
  cancel_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint cancel_needs_reason check (status <> 'cancelled' or length(trim(cancel_reason)) > 0)
);
create index sales_created_at on public.sales (created_at desc);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id),
  product_name text not null,                       -- foto do nome no momento da venda
  qty integer not null check (qty > 0),
  unit_price_cents bigint not null,
  discount_type public.discount_type,
  discount_value numeric(12, 2),
  line_total_cents bigint not null
);

-- ---------------------------------------------------------------- estoque
create table public.stock_entries (
  id uuid primary key default gen_random_uuid(),
  client_id text unique,
  product_id uuid not null references public.products (id),
  qty integer not null check (qty > 0),
  cost_cents bigint,
  price_cents bigint,
  supplier_id uuid not null references public.suppliers (id),   -- fornecedor obrigatório (§8.3)
  user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

-- Histórico de toda movimentação (base para §13.3 "histórico de movimentações").
create table public.stock_movements (
  id bigserial primary key,
  product_id uuid not null references public.products (id),
  delta integer not null,
  reason text not null check (reason in ('sale', 'sale_cancel', 'entry')),
  ref_id uuid,
  user_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS
-- §1.3: todos os usuários autenticados têm as mesmas permissões (perfis ficam para depois).
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_entries enable row level security;
alter table public.stock_movements enable row level security;

create policy read_all on public.profiles for select to authenticated using (true);
create policy read_all on public.categories for select to authenticated using (true);
create policy write_all on public.categories for insert to authenticated with check (true);
create policy read_all on public.suppliers for select to authenticated using (true);
create policy write_all on public.suppliers for insert to authenticated with check (true);
create policy read_all on public.customers for select to authenticated using (true);
create policy insert_all on public.customers for insert to authenticated with check (true);
create policy update_all on public.customers for update to authenticated using (true);
create policy read_all on public.products for select to authenticated using (true);
create policy insert_all on public.products for insert to authenticated with check (stock_qty = 0); -- saldo inicial só via entrada
create policy update_all on public.products for update to authenticated using (true);
create policy read_all on public.cash_sessions for select to authenticated using (true);
create policy read_all on public.sales for select to authenticated using (true);
create policy read_all on public.sale_items for select to authenticated using (true);
create policy read_all on public.stock_entries for select to authenticated using (true);
create policy read_all on public.stock_movements for select to authenticated using (true);
-- Sem policy de insert/update em sales, sale_items, stock_*, cash_sessions: só as RPCs (security definer) escrevem.

-- Impede que um UPDATE direto mude estoque (só RPCs, que ligam a flag ordo.stock_rpc).
create function public.guard_stock_update() returns trigger language plpgsql as $$
begin
  if new.stock_qty is distinct from old.stock_qty and coalesce(current_setting('ordo.stock_rpc', true), '') <> 'on' then
    raise exception 'Estoque só pode mudar por venda, cancelamento ou entrada de mercadorias.' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger products_guard_stock before update on public.products for each row execute function public.guard_stock_update();

-- Cria o profile ao cadastrar usuário no Auth (nome vem de user_metadata.name).
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
