-- Teste das regras de negócio. Rode num banco de teste (não em produção!):
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rpc_test.sql
-- Cada bloco levanta exceção se a regra falhar.
begin;
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-00000000000a', 'joao.balcao@ordo.local', '{"name":"João"}');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);

-- entrada soma ao saldo (chapa: 0 + 3)
do $$ declare r jsonb; begin
  r := public.register_stock_entry(jsonb_build_object('product_id', (select id from products where code='CHG20'), 'qty', 3, 'supplier_name', 'Aço Forte Distribuidora'));
  assert (r->>'new_qty')::int = 3, 'entrada deveria somar 3';
  perform public.register_stock_entry(jsonb_build_object('product_id', (select id from products where code='MET3020'), 'qty', 24, 'supplier_name', 'Metais Planalto'));
  perform public.register_stock_entry(jsonb_build_object('product_id', (select id from products where code='FVR18'), 'qty', 65, 'supplier_name', 'Metais Planalto'));
end $$;

-- não vende acima do estoque (4 chapas com saldo 3)
do $$ begin
  perform public.finalize_sale(jsonb_build_object('client_id', 't-over', 'payment_method', 'pix',
    'items', jsonb_build_array(jsonb_build_object('product_id', (select id from products where code='CHG20'), 'qty', 4))));
  raise exception 'deveria ter recusado';
exception when sqlstate 'P0001' then
  assert sqlerrm like '%só 3 em estoque%', 'mensagem errada: ' || sqlerrm;
end $$;

-- venda #1048 do Figma = R$ 456,32 (metalon 2 × -10%, chapa 2, fita 1) e baixa de estoque
do $$ declare r jsonb; begin
  r := public.finalize_sale(jsonb_build_object('client_id', 't-1048', 'payment_method', 'pix', 'items', jsonb_build_array(
    jsonb_build_object('product_id', (select id from products where code='MET3020'), 'qty', 2, 'discount_type', 'percent', 'discount_value', 10),
    jsonb_build_object('product_id', (select id from products where code='CHG20'), 'qty', 2),
    jsonb_build_object('product_id', (select id from products where code='FVR18'), 'qty', 1))));
  assert (r->>'total_cents')::bigint = 45632, 'total deveria ser 45632, veio ' || (r->>'total_cents');
  assert (select stock_qty from products where code='CHG20') = 1, 'chapa deveria ficar com 1';
  -- reenvio da fila offline com o mesmo client_id não duplica
  r := public.finalize_sale(jsonb_build_object('client_id', 't-1048', 'payment_method', 'pix', 'items', '[]'::jsonb));
  assert (select count(*) from sales where client_id='t-1048') = 1, 'venda duplicada';
end $$;

-- estoque não muda por update direto
do $$ begin
  update products set stock_qty = 999 where code = 'CHG20';
  raise exception 'update direto deveria falhar';
exception when sqlstate 'P0001' then null; end $$;

-- cancelamento exige motivo e devolve estoque
do $$ declare v uuid := (select id from sales where client_id='t-1048'); begin
  begin perform public.cancel_sale(jsonb_build_object('sale_id', v, 'reason', ' ')); raise exception 'deveria exigir motivo';
  exception when sqlstate 'P0001' then null; end;
  perform public.cancel_sale(jsonb_build_object('sale_id', v, 'reason', 'Cliente desistiu'));
  assert (select stock_qty from products where code='CHG20') = 3, 'cancelamento deveria devolver 2 chapas';
  assert (select status from sales where id = v) = 'cancelled';
end $$;

-- caixa: esperado = troco + vendas em dinheiro
do $$ declare r jsonb; begin
  perform public.open_cash_session(15000);
  perform public.finalize_sale(jsonb_build_object('client_id', 't-cash', 'payment_method', 'dinheiro',
    'items', jsonb_build_array(jsonb_build_object('product_id', (select id from products where code='FVR18'), 'qty', 2))));
  r := public.close_cash_session(15800, 'teste');
  assert (r->>'expected_cents')::bigint = 15900, 'esperado errado: ' || r::text;
  assert (r->>'difference_cents')::bigint = -100;
end $$;

-- relatório considera cancelamentos
do $$ declare r jsonb := public.daily_report(); begin
  assert (r->>'sales_count')::int = 1, 'deveria contar só a venda não cancelada: ' || r::text;
  assert jsonb_array_length(r->'cancelled') = 1;
end $$;

-- busca por voz normalizada
do $$ begin
  assert (select count(*) from public.search_products('metalon 30 por 20')) = 1, 'busca 30 por 20';
end $$;

select 'TODOS OS TESTES PASSARAM' as resultado;
rollback;
