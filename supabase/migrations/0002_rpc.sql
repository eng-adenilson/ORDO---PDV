-- ORDO — funções de negócio (RPC). O app chama via supabase.rpc('<nome>', { payload }).
-- Erros de regra usam ERRCODE 'P0001' com mensagem pronta para o vendedor ler.
-- Todas são idempotentes por client_id quando vêm da fila offline.

-- ---------------------------------------------------------------- busca
create or replace function public.search_products(q text)
returns setof public.sale_products language sql stable security invoker as $$
  select sp.* from public.sale_products sp
  join public.products p on p.id = sp.id
  where (
    select bool_and(p.search like '%' || t || '%')
    from unnest(string_to_array(lower(unaccent(regexp_replace(q, '(\d+)\s*(x|por)\s*(\d+)', '\1x\3', 'gi'))), ' ')) t
    where t <> '' and t not in ('de', 'do', 'da', 'o', 'a', 'com')
  )
  order by similarity(p.search, lower(q)) desc, p.name
  limit 30;
$$;

-- ---------------------------------------------------------------- venda
-- payload: { client_id, customer_id?, payment_method, items: [{ product_id, qty, discount_type?, discount_value? }] }
create or replace function public.finalize_sale(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_existing public.sales;
  v_sale_id uuid := gen_random_uuid();
  v_item jsonb;
  v_prod public.products;
  v_qty int;
  v_unit bigint;
  v_final bigint;
  v_dtype public.discount_type;
  v_dval numeric;
  v_gross bigint := 0;
  v_disc bigint := 0;
  v_session uuid;
  v_number bigint;
begin
  if auth.uid() is null then raise exception 'Faça login novamente.' using errcode = 'P0001'; end if;

  select * into v_existing from public.sales where client_id = payload ->> 'client_id';
  if found then  -- reenvio da fila offline: devolve o que já foi gravado
    return jsonb_build_object('id', v_existing.id, 'number', v_existing.number, 'total_cents', v_existing.total_cents);
  end if;

  if jsonb_array_length(coalesce(payload -> 'items', '[]')) = 0 then
    raise exception 'Carrinho vazio.' using errcode = 'P0001';
  end if;

  perform set_config('ordo.stock_rpc', 'on', true);
  select id into v_session from public.cash_sessions where closed_at is null limit 1;

  insert into public.sales (id, client_id, seller_id, customer_id, cash_session_id, payment_method, gross_cents, discount_cents, total_cents)
  values (v_sale_id, payload ->> 'client_id', auth.uid(), nullif(payload ->> 'customer_id', '')::uuid, v_session,
          (payload ->> 'payment_method')::public.payment_method, 0, 0, 0)
  returning number into v_number;

  -- Ordena por id para travar sempre na mesma ordem (evita deadlock entre aparelhos).
  for v_item in select value from jsonb_array_elements(payload -> 'items') order by value ->> 'product_id' loop
    v_qty := (v_item ->> 'qty')::int;
    if v_qty is null or v_qty <= 0 then raise exception 'Quantidade inválida.' using errcode = 'P0001'; end if;

    select * into v_prod from public.products where id = (v_item ->> 'product_id')::uuid for update;
    if not found or not v_prod.active then raise exception 'Produto indisponível.' using errcode = 'P0001'; end if;
    if v_prod.stock_qty < v_qty then
      raise exception '%: só % em estoque.', v_prod.name, v_prod.stock_qty using errcode = 'P0001';
    end if;

    v_unit := coalesce(v_prod.price_cents, 0);  -- preço do servidor; o app não define preço
    v_dtype := nullif(v_item ->> 'discount_type', '')::public.discount_type;
    v_dval := nullif(v_item ->> 'discount_value', '')::numeric;
    v_final := case
      when v_dtype = 'percent' then greatest(0, v_unit - round(v_unit * least(v_dval, 100) / 100))
      when v_dtype = 'amount' then greatest(0, v_unit - round(v_dval))
      else v_unit end;

    insert into public.sale_items (sale_id, product_id, product_name, qty, unit_price_cents, discount_type, discount_value, line_total_cents)
    values (v_sale_id, v_prod.id, v_prod.name, v_qty, v_unit, v_dtype, v_dval, v_final * v_qty);

    update public.products set stock_qty = stock_qty - v_qty where id = v_prod.id;
    insert into public.stock_movements (product_id, delta, reason, ref_id, user_id) values (v_prod.id, -v_qty, 'sale', v_sale_id, auth.uid());

    v_gross := v_gross + v_unit * v_qty;
    v_disc := v_disc + (v_unit - v_final) * v_qty;
  end loop;

  update public.sales set gross_cents = v_gross, discount_cents = v_disc, total_cents = v_gross - v_disc where id = v_sale_id;
  return jsonb_build_object('id', v_sale_id, 'number', v_number, 'total_cents', v_gross - v_disc);
end $$;

-- payload: { sale_id, reason }
create or replace function public.cancel_sale(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_sale public.sales;
  v_reason text := trim(payload ->> 'reason');
  r record;
begin
  if auth.uid() is null then raise exception 'Faça login novamente.' using errcode = 'P0001'; end if;
  if v_reason is null or v_reason = '' then raise exception 'Informe o motivo para continuar.' using errcode = 'P0001'; end if;

  select * into v_sale from public.sales where id = (payload ->> 'sale_id')::uuid for update;
  if not found then raise exception 'Venda não encontrada.' using errcode = 'P0001'; end if;
  if v_sale.status = 'cancelled' then
    return jsonb_build_object('id', v_sale.id, 'status', 'cancelled'); -- idempotente
  end if;

  perform set_config('ordo.stock_rpc', 'on', true);
  for r in select product_id, qty from public.sale_items where sale_id = v_sale.id order by product_id loop
    update public.products set stock_qty = stock_qty + r.qty where id = r.product_id;
    insert into public.stock_movements (product_id, delta, reason, ref_id, user_id) values (r.product_id, r.qty, 'sale_cancel', v_sale.id, auth.uid());
  end loop;

  update public.sales set status = 'cancelled', cancel_reason = v_reason, cancelled_at = now(), cancelled_by = auth.uid() where id = v_sale.id;
  return jsonb_build_object('id', v_sale.id, 'status', 'cancelled');
end $$;

-- ---------------------------------------------------------------- entrada de mercadorias
-- payload: { client_id?, product_id? | new_product: { code, name, category_id?, description?, photo_url? },
--            qty, cost_cents?, price_cents?, supplier_id? | supplier_name }
create or replace function public.register_stock_entry(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_product uuid := nullif(payload ->> 'product_id', '')::uuid;
  v_supplier uuid := nullif(payload ->> 'supplier_id', '')::uuid;
  v_qty int := (payload ->> 'qty')::int;
  v_cost bigint := nullif(payload ->> 'cost_cents', '')::bigint;
  v_price bigint := nullif(payload ->> 'price_cents', '')::bigint;
  v_entry uuid;
  v_new_qty int;
begin
  if auth.uid() is null then raise exception 'Faça login novamente.' using errcode = 'P0001'; end if;
  if v_qty is null or v_qty <= 0 then raise exception 'Informe a quantidade recebida.' using errcode = 'P0001'; end if;

  if payload ? 'client_id' then
    select id into v_entry from public.stock_entries where client_id = payload ->> 'client_id';
    if found then return jsonb_build_object('id', v_entry); end if;
  end if;

  if v_supplier is null then
    if coalesce(trim(payload ->> 'supplier_name'), '') = '' then raise exception 'Informe o fornecedor.' using errcode = 'P0001'; end if;
    insert into public.suppliers (name) values (trim(payload ->> 'supplier_name'))
      on conflict (name) do update set name = excluded.name returning id into v_supplier;
  end if;

  if v_product is null then  -- §8.2: cadastra e dá entrada no mesmo fluxo
    insert into public.products (code, name, category_id, description, photo_url, cost_cents, price_cents)
    values (payload -> 'new_product' ->> 'code', payload -> 'new_product' ->> 'name',
            nullif(payload -> 'new_product' ->> 'category_id', '')::uuid, payload -> 'new_product' ->> 'description',
            payload -> 'new_product' ->> 'photo_url', v_cost, v_price)
    returning id into v_product;
  end if;

  perform set_config('ordo.stock_rpc', 'on', true);
  update public.products
     set stock_qty = stock_qty + v_qty,                 -- soma, nunca substitui (§8.1)
         cost_cents = coalesce(v_cost, cost_cents),
         price_cents = coalesce(v_price, price_cents)
   where id = v_product
  returning stock_qty into v_new_qty;
  if not found then raise exception 'Produto não encontrado.' using errcode = 'P0001'; end if;

  insert into public.stock_entries (client_id, product_id, qty, cost_cents, price_cents, supplier_id, user_id)
  values (payload ->> 'client_id', v_product, v_qty, v_cost, v_price, v_supplier, auth.uid())
  returning id into v_entry;
  insert into public.stock_movements (product_id, delta, reason, ref_id, user_id) values (v_product, v_qty, 'entry', v_entry, auth.uid());

  return jsonb_build_object('id', v_entry, 'product_id', v_product, 'new_qty', v_new_qty);
end $$;

-- ---------------------------------------------------------------- estoque
create or replace function public.stock_summary(low_default int default 5)
returns jsonb language sql stable security invoker as $$
  select jsonb_build_object(
    'products', count(*),
    'units', coalesce(sum(stock_qty), 0),
    'cost_value_cents', coalesce(sum(stock_qty * coalesce(cost_cents, 0)), 0),
    'sale_value_cents', coalesce(sum(stock_qty * coalesce(price_cents, 0)), 0),
    'out_of_stock', count(*) filter (where stock_qty = 0),
    'low_stock', count(*) filter (where stock_qty > 0 and stock_qty <= coalesce(min_stock, low_default))
  ) from public.products where active;
$$;

-- ---------------------------------------------------------------- caixa
create or replace function public.open_cash_session(opening_cents bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if exists (select 1 from public.cash_sessions where closed_at is null) then
    raise exception 'Já existe um caixa aberto.' using errcode = 'P0001';
  end if;
  insert into public.cash_sessions (opened_by, opening_cents) values (auth.uid(), opening_cents) returning id into v_id;
  return jsonb_build_object('id', v_id);
end $$;

-- Esperado = troco inicial + vendas em DINHEIRO não canceladas da sessão (§10.3).
create or replace function public.close_cash_session(counted_cents bigint, note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.cash_sessions; v_expected bigint;
begin
  select * into s from public.cash_sessions where closed_at is null for update;
  if not found then raise exception 'Nenhum caixa aberto.' using errcode = 'P0001'; end if;
  select s.opening_cents + coalesce(sum(total_cents), 0) into v_expected
    from public.sales where cash_session_id = s.id and payment_method = 'dinheiro' and status = 'completed';
  update public.cash_sessions set closed_at = now(), closed_by = auth.uid(), expected_cents = v_expected,
         counted_cents = close_cash_session.counted_cents, note = close_cash_session.note where id = s.id;
  return jsonb_build_object('expected_cents', v_expected, 'counted_cents', counted_cents, 'difference_cents', counted_cents - v_expected);
end $$;

-- Relatório diário (§10.1): tudo numa chamada, já descontando cancelamentos.
create or replace function public.daily_report(day date default current_date)
returns jsonb language sql stable security invoker as $$
  with s as (select * from public.sales where created_at::date = day)
  select jsonb_build_object(
    'date', day,
    'sales_count', (select count(*) from s where status = 'completed'),
    'gross_cents', (select coalesce(sum(gross_cents), 0) from s where status = 'completed'),
    'discount_cents', (select coalesce(sum(discount_cents), 0) from s where status = 'completed'),
    'net_cents', (select coalesce(sum(total_cents), 0) from s where status = 'completed'),
    'cancelled', (select coalesce(jsonb_agg(jsonb_build_object('number', number, 'reason', cancel_reason, 'total_cents', total_cents) order by number), '[]') from s where status = 'cancelled'),
    'by_payment', (select coalesce(jsonb_object_agg(payment_method, t), '{}') from (select payment_method, sum(total_cents) t from s where status = 'completed' group by 1) x),
    'by_seller', (select coalesce(jsonb_agg(jsonb_build_object('name', p.name, 'count', c, 'total_cents', t) order by t desc), '[]')
                  from (select seller_id, count(*) c, sum(total_cents) t from s where status = 'completed' group by 1) x join public.profiles p on p.id = x.seller_id),
    'products', (select coalesce(jsonb_agg(jsonb_build_object('name', product_name, 'qty', q) order by q desc), '[]')
                 from (select product_name, sum(qty) q from public.sale_items i join s on s.id = i.sale_id where s.status = 'completed' group by 1) x)
  );
$$;

grant execute on function public.search_products(text), public.finalize_sale(jsonb), public.cancel_sale(jsonb),
  public.register_stock_entry(jsonb), public.stock_summary(int), public.open_cash_session(bigint),
  public.close_cash_session(bigint, text), public.daily_report(date) to authenticated;
