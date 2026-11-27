import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strFromU8, unzipSync } from 'fflate';
import { buildXlsx, colName } from '../xlsx.ts';
import { reportWorkbook, stockWorkbook } from '../reports.ts';

test('colName converte índice em letras de coluna', () => {
  assert.equal(colName(0), 'A');
  assert.equal(colName(25), 'Z');
  assert.equal(colName(26), 'AA');
});

test('xlsx é um zip com as partes obrigatórias, texto escapado e números como número', () => {
  const zip = unzipSync(buildXlsx([{ name: 'A/B', rows: [['Nome', 'Valor'], ['Tubo <6m> & cia', 12.5], [null, 3]] }]));
  for (const f of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml']) assert.ok(zip[f], f);
  const sheet = strFromU8(zip['xl/worksheets/sheet1.xml']!);
  assert.match(sheet, /Tubo &lt;6m&gt; &amp; cia/);
  assert.match(sheet, /<c r="B2"><v>12.5<\/v><\/c>/);
  assert.match(strFromU8(zip['xl/workbook.xml']!), /name="A B"/); // "/" não é permitido no nome da aba
});

test('planilha de estoque traz situação e resumo', () => {
  const zip = unzipSync(stockWorkbook(
    [{ id: '1', code: 'CHG20', name: 'Chapa', stock_qty: 3, min_stock: 5, active: true, price_cents: 14500, cost_cents: 9800 },
      { id: '2', code: 'CIM50', name: 'Cimento', stock_qty: 0, min_stock: 10, active: true, price_cents: 3890, cost_cents: 2900 }],
    { products: 2, units: 3, cost_value_cents: 29400, sale_value_cents: 43500, out_of_stock: 1, low_stock: 1 }));
  const s = strFromU8(zip['xl/worksheets/sheet1.xml']!);
  assert.match(s, /Baixo/);
  assert.match(s, /Zerado/);
  assert.match(s, /<v>145<\/v>/);
});

test('relatório do dia inclui diferença do caixa', () => {
  const zip = unzipSync(reportWorkbook({
    date: '2026-11-26', sales_count: 2, cancelled_count: 1, sellers_count: 1, gross_cents: 100, discount_cents: 0, net_cents: 100, cancelled_cents: 50,
    cancelled: [{ number: 3, reason: 'Duplicada', total_cents: 50 }], by_payment: { pix: 100 }, by_seller: [{ name: 'João', count: 2, total_cents: 100 }], products: [{ name: 'Fita', qty: 2 }],
  }, { opening_cents: 15000, expected_cents: 15100, counted_cents: 15000 }));
  assert.match(strFromU8(zip['xl/worksheets/sheet1.xml']!), /Diferença/);
  assert.match(strFromU8(zip['xl/worksheets/sheet1.xml']!), /<v>-1<\/v>/);
  assert.match(strFromU8(zip['xl/worksheets/sheet5.xml']!), /Duplicada/);
});
