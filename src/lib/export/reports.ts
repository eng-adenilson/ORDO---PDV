import { PAYMENT_LABEL, type DailyReport, type PaymentMethod, type StockRow, type StockSummary } from '../../types/domain.ts';
import { buildXlsx, reais, type Sheet } from './xlsx.ts';

const lowOf = (r: StockRow) => r.stock_qty > 0 && r.stock_qty <= (r.min_stock ?? 5);
const statusOf = (r: StockRow) => (r.stock_qty === 0 ? 'Zerado' : lowOf(r) ? 'Baixo' : 'OK');

/** Planilha de estoque (R9). `stamp` = data/hora legível para o cabeçalho. */
export function stockWorkbook(rows: StockRow[], summary: StockSummary): Uint8Array {
  const sheet: Sheet = {
    name: 'Estoque', widths: [14, 40, 10, 16, 14, 14],
    rows: [['Código', 'Produto', 'Saldo (un)', 'Situação', 'Custo (R$)', 'Venda (R$)'],
      ...rows.map((r) => [r.code, r.name, r.stock_qty, statusOf(r), reais(r.cost_cents), reais(r.price_cents)])],
  };
  const resumo: Sheet = {
    name: 'Resumo', widths: [28, 16],
    rows: [['Totalizador', 'Valor'], ['Produtos ativos', summary.products], ['Unidades em estoque', summary.units],
      ['Valor a custo (R$)', reais(summary.cost_value_cents)], ['Valor de venda (R$)', reais(summary.sale_value_cents)],
      ['Sem estoque', summary.out_of_stock], ['Estoque baixo', summary.low_stock]],
  };
  return buildXlsx([sheet, resumo]);
}

/** Relatório do dia / fechamento de caixa (10, 14, R6). */
export function reportWorkbook(r: DailyReport, cash?: { opening_cents: number; expected_cents: number; counted_cents?: number | null } | null): Uint8Array {
  const resumo: Sheet = {
    name: 'Resumo do dia', widths: [30, 18],
    rows: [['Item', 'Valor'], ['Data', r.date], ['Vendas líquidas (R$)', reais(r.net_cents)], ['Vendas concluídas', r.sales_count],
      ['Vendas canceladas', r.cancelled_count], ['Bruto (R$)', reais(r.gross_cents)], ['Descontos (R$)', reais(r.discount_cents)], ['Cancelado (R$)', reais(r.cancelled_cents)],
      ...(cash ? [['Troco inicial (R$)', reais(cash.opening_cents)], ['Esperado na gaveta (R$)', reais(cash.expected_cents)],
        ...(cash.counted_cents != null ? [['Contado (R$)', reais(cash.counted_cents)], ['Diferença (R$)', reais(cash.counted_cents - cash.expected_cents)]] : [])] : [])],
  };
  const pays: Sheet = {
    name: 'Pagamentos', widths: [20, 16],
    rows: [['Forma de pagamento', 'Total (R$)'], ...(['pix', 'dinheiro', 'credito', 'debito'] as PaymentMethod[]).map((m) => [PAYMENT_LABEL[m], reais(r.by_payment[m] ?? 0)])],
  };
  const prods: Sheet = { name: 'Produtos vendidos', widths: [40, 12], rows: [['Produto', 'Quantidade'], ...r.products.map((p) => [p.name, p.qty])] };
  const sellers: Sheet = { name: 'Vendedores', widths: [24, 12, 16], rows: [['Vendedor', 'Vendas', 'Total (R$)'], ...r.by_seller.map((s) => [s.name, s.count, reais(s.total_cents)])] };
  const canc: Sheet = { name: 'Cancelamentos', widths: [12, 40, 14], rows: [['Venda', 'Motivo', 'Valor (R$)'], ...r.cancelled.map((c) => [`#${c.number}`, c.reason ?? '', reais(c.total_cents)])] };
  return buildXlsx([resumo, pays, prods, sellers, canc]);
}
