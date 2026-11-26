-- Dados de demonstração — os mesmos das telas do Figma (SPEC §11). Opcional; rode após as migrations.
-- Usuários: crie no painel Auth (joao.balcao@ordo.local, carla@ordo.local) com user_metadata {"name": "João"} etc.
insert into public.categories (name) values ('Metalon'), ('Chapas'), ('Hidráulica'), ('Elétrica'), ('Básicos'), ('Fixação'), ('Abrasivos')
  on conflict do nothing;
insert into public.suppliers (name) values ('Aço Forte Distribuidora'), ('Metais Planalto'), ('Fixar Parafusos Ltda') on conflict do nothing;

insert into public.products (code, name, category_id, cost_cents, price_cents, min_stock)
select v.code, v.name, c.id, v.cost, v.price, v.min_stock
from (values
  ('MET3020', 'Metalon 30x20 #18 6m', 'Metalon', 6140, 8990, 5),
  ('CHG20', 'Chapa galvanizada nº 20', 'Chapas', 9800, 14500, 5),
  ('PVC100', 'Tubo PVC 100mm 6m', 'Hidráulica', 5200, 7950, 4),
  ('CIM50', 'Cimento CP-II 50kg', 'Básicos', 2900, 3890, 10),
  ('DSC7', 'Disco de corte 7"', 'Abrasivos', 750, 1290, 10),
  ('FVR18', 'Fita veda-rosca 18mm', 'Hidráulica', 210, 450, 10)
) as v(code, name, cat, cost, price, min_stock)
join public.categories c on c.name = v.cat
on conflict (code) do nothing;
-- Saldos iniciais entram por register_stock_entry (estoque nunca é escrito direto).

insert into public.customers (name, phone) values
  ('Ana Lúcia Rocha', '(61) 9 9811-2034'), ('Construtora Bom Tijolo', '(61) 3344-1200'), ('Marcos Pereira', '(61) 9 8123-4455');
