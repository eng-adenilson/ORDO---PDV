import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { BusinessError, createEngine, DuplicateCodeError } from '../engine.ts';
import { createTestDb } from './sqljsDb.ts';

const joao = { id: 'u-joao', name: 'João' };
const carla = { id: 'u-carla', name: 'Carla' };
async function setup(at = new Date(2026, 10, 26, 9, 0)) {
  const clock = { t: at };
  const e = createEngine({ db: await createTestDb(), uuid: randomUUID, now: () => clock.t });
  await e.init();
  return { e, clock };
}
type Item = { product_id: string; qty: number; discount_type?: 'percent' | 'amount'; discount_value?: number };
const sale = (items: Item[], pay: 'pix' | 'dinheiro' = 'pix') => ({ client_id: randomUUID(), payment_method: pay, items });

test('init é idempotente e carrega o catálogo do SPEC §11', async () => {
  const { e } = await setup();
  await e.init();
  assert.equal((await e.listSaleProducts()).length, 7); // 8 produtos, 1 inativo
  assert.equal((await e.listCategories()).length, 7);
});

test('busca por texto e por medida', async () => {
  const { e } = await setup();
  assert.deepEqual((await e.searchProducts('metalon 30 por 20')).map((p) => p.code), ['MET3020']);
  assert.deepEqual((await e.searchProducts('chapa 20')).map((p) => p.code), ['CHG20']);
  assert.equal((await e.searchProducts('torneira')).length, 0); // inativo não aparece na venda
  assert.equal((await e.searchProducts('')).length, 0);
});

test('venda do Figma: R$ 456,32, baixa estoque e usa preço do banco', async () => {
  const { e } = await setup();
  const r = await e.finalizeSale(joao, sale([
    { product_id: 'p1', qty: 2, discount_type: 'percent', discount_value: 10 }, { product_id: 'p2', qty: 2 }, { product_id: 'p6', qty: 1 }]));
  assert.equal(r.total_cents, 45632);
  assert.equal(r.number, 1);
  assert.equal(await e.getAvailableQty('p1'), 22);
  assert.equal(await e.getAvailableQty('p2'), 1);
  const d = await e.getSale(r.id);
  assert.equal(d?.items.length, 3);
  assert.equal(d?.discount_cents, 1798);
});

test('não vende acima do saldo e não baixa nada (transação desfeita)', async () => {
  const { e } = await setup();
  await assert.rejects(e.finalizeSale(joao, sale([{ product_id: 'p1', qty: 1 }, { product_id: 'p2', qty: 4 }])), (err: unknown) =>
    err instanceof BusinessError && /Chapa galvanizada nº 20: só 3 em estoque/.test(err.message));
  assert.equal(await e.getAvailableQty('p1'), 24);
  assert.equal((await e.listSales('today')).length, 0);
});

test('última unidade: a segunda venda é recusada e o saldo nunca fica negativo', async () => {
  const { e } = await setup();
  await e.finalizeSale(joao, sale([{ product_id: 'p2', qty: 3 }]));
  await assert.rejects(e.finalizeSale(carla, sale([{ product_id: 'p2', qty: 1 }])), /só 0 em estoque/);
  assert.equal(await e.getAvailableQty('p2'), 0);
});

test('client_id repetido não duplica a venda (idempotência)', async () => {
  const { e } = await setup();
  const p = sale([{ product_id: 'p5', qty: 2 }]);
  const a = await e.finalizeSale(joao, p);
  const b = await e.finalizeSale(joao, p);
  assert.equal(a.id, b.id);
  assert.equal(await e.getAvailableQty('p5'), 38);
});

test('cancelamento exige motivo, devolve estoque e mantém o registro', async () => {
  const { e } = await setup();
  const r = await e.finalizeSale(joao, sale([{ product_id: 'p5', qty: 4 }]));
  await assert.rejects(e.cancelSale(joao, { sale_id: r.id, reason: '  ' }), /Informe o motivo/);
  await e.cancelSale(carla, { sale_id: r.id, reason: 'Cliente desistiu' });
  assert.equal(await e.getAvailableQty('p5'), 40);
  const d = await e.getSale(r.id);
  assert.equal(d?.status, 'cancelled');
  assert.equal(d?.cancelled_by_name, 'Carla');
  assert.equal(d?.cancel_reason, 'Cliente desistiu');
  await e.cancelSale(joao, { sale_id: r.id, reason: 'de novo' }); // idempotente
  assert.equal(await e.getAvailableQty('p5'), 40);
  assert.equal((await e.listSales('cancelled')).length, 1);
});

test('histórico por período', async () => {
  const { e, clock } = await setup(new Date(2026, 10, 25, 10, 0));
  await e.finalizeSale(joao, sale([{ product_id: 'p5', qty: 1 }]));
  clock.t = new Date(2026, 10, 26, 10, 0);
  await e.finalizeSale(joao, sale([{ product_id: 'p5', qty: 1 }]));
  assert.equal((await e.listSales('today')).length, 1);
  assert.equal((await e.listSales('yesterday')).length, 1);
  assert.equal((await e.listSales('7d')).length, 2);
});

test('produto: código único, só nome e código obrigatórios, estoque inicial 0', async () => {
  const { e } = await setup();
  const base = { category_id: null, description: null, photo_url: null, cost_cents: null, price_cents: null, active: true };
  const p = await e.saveProduct({ ...base, code: 'NOVO1', name: 'Produto novo' });
  assert.equal(p.stock_qty, 0);
  await assert.rejects(e.saveProduct({ ...base, code: 'novo1', name: 'Outro' }), (err: unknown) => err instanceof DuplicateCodeError && err.existingName === 'Produto novo');
  await assert.rejects(e.saveProduct({ ...base, code: '', name: 'x' }), /código/);
  const edited = await e.saveProduct({ ...base, code: 'NOVO1', name: 'Renomeado', price_cents: 1000, active: false }, p.id);
  assert.equal(edited.name, 'Renomeado');
  assert.equal(edited.active, false);
  assert.equal((await e.listProducts({ filter: 'inactive' })).length, 2);
});

test('entrada de mercadorias soma ao saldo, exige fornecedor e cria o fornecedor pelo nome', async () => {
  const { e } = await setup();
  await assert.rejects(e.registerStockEntry(joao, { product_id: 'p2', qty: 20 }), /fornecedor/);
  await assert.rejects(e.registerStockEntry(joao, { product_id: 'p2', qty: 0, supplier_name: 'X' }), /quantidade/);
  const r = await e.registerStockEntry(joao, { client_id: 'c-1', product_id: 'p2', qty: 20, cost_cents: 10000, price_cents: 15000, supplier_name: 'Aço Novo Ltda' });
  assert.equal(r.prev_qty, 3);
  assert.equal(r.new_qty, 23);
  assert.equal((await e.getProduct('p2'))?.price_cents, 15000);
  const again = await e.registerStockEntry(joao, { client_id: 'c-1', product_id: 'p2', qty: 20, supplier_name: 'Aço Novo Ltda' });
  assert.equal(again.new_qty, 23);
  assert.equal(await e.getAvailableQty('p2'), 23);
  assert.ok((await e.listSuppliers()).some((s) => s.name === 'Aço Novo Ltda'));
  assert.equal((await e.listEntries('p2')).length, 1);
});

test('entrada com produto novo cadastra e dá entrada no mesmo fluxo', async () => {
  const { e } = await setup();
  const r = await e.registerStockEntry(joao, { new_product: { code: 'LIX80', name: 'Lixa 80' }, qty: 50, cost_cents: 100, price_cents: 250, supplier_id: 's1' });
  assert.equal(r.new_qty, 50);
  assert.equal((await e.getProduct(r.product_id))?.stock_qty, 50);
  await assert.rejects(e.registerStockEntry(joao, { new_product: { code: 'LIX80', name: 'Outra' }, qty: 5, supplier_id: 's1' }), DuplicateCodeError);
});

test('resumo de estoque (6 totalizadores) e filtros', async () => {
  const { e } = await setup();
  const s = await e.stockSummary();
  assert.equal(s.products, 7);
  assert.equal(s.out_of_stock, 1);
  assert.equal(s.low_stock, 1);
  assert.equal(s.units, 24 + 3 + 12 + 0 + 40 + 65 + 500);
  assert.deepEqual((await e.listStock({ filter: 'low' })).map((r) => r.code), ['CHG20']);
  assert.deepEqual((await e.listStock({ filter: 'out' })).map((r) => r.code), ['CIM50']);
  assert.deepEqual((await e.listStock({ q: 'pvc' })).map((r) => r.code), ['PVC100']);
});

test('clientes: busca por nome e telefone, cadastro validado, contagem de compras', async () => {
  const { e } = await setup();
  assert.equal((await e.listCustomers('marcos')).length, 1);
  assert.equal((await e.listCustomers('9 8123')).length, 1);
  await assert.rejects(e.createCustomer(joao, { name: 'Zé', phone: '123' }), /telefone/);
  const c = await e.createCustomer(joao, { name: 'Zé da Obra', phone: '(61) 9 9999-0000' });
  await e.finalizeSale(joao, { ...sale([{ product_id: 'p5', qty: 1 }]), customer_id: c.id });
  const row = (await e.listCustomers('zé'))[0];
  assert.equal(row?.purchases, 1);
});

test('caixa: um só aberto, esperado = troco + vendas em dinheiro, relatório do dia sem cancelamentos', async () => {
  const { e } = await setup();
  assert.equal(await e.getOpenSession(), null);
  await e.openCash(carla, 15000);
  await assert.rejects(e.openCash(joao, 100), /Já existe um caixa aberto/);
  await e.finalizeSale(joao, sale([{ product_id: 'p5', qty: 10 }], 'dinheiro')); // 129,00
  const canc = await e.finalizeSale(joao, sale([{ product_id: 'p6', qty: 2 }], 'dinheiro')); // 9,00 cancelada
  await e.finalizeSale(carla, sale([{ product_id: 'p3', qty: 1 }], 'pix'));
  await e.cancelSale(joao, { sale_id: canc.id, reason: 'Lançado em duplicidade' });
  const exp = await e.cashExpected();
  assert.equal(exp?.expected_cents, 15000 + 12900);
  const rep = await e.dailyReport();
  assert.equal(rep.sales_count, 2);
  assert.equal(rep.cancelled_count, 1);
  assert.equal(rep.net_cents, 12900 + 7950);
  assert.equal(rep.cancelled_cents, 900);
  assert.equal(rep.by_payment.pix, 7950);
  assert.equal(rep.sellers_count, 2);
  assert.equal(rep.cancelled[0]?.reason, 'Lançado em duplicidade');
  const close = await e.closeCash(joao, 27800, 'faltou 1 nota');
  assert.equal(close.difference_cents, -100);
  assert.equal(await e.getOpenSession(), null);
  assert.equal((await e.lastClosedSession())?.counted_cents, 27800);
  await assert.rejects(e.closeCash(joao, 1), /Nenhum caixa aberto/);
});
