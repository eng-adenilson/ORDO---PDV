import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cartReducer, canCheckout, emptyCart, summarize } from '../cart.ts';

const metalon = { id: 'p1', code: 'MET3020', name: 'Metalon 30x20 #18 6m', photo_url: null, price_cents: 8990, category_id: null };
const chapa = { id: 'p2', code: 'CHG20', name: 'Chapa galvanizada nº 20', photo_url: null, price_cents: 14500, category_id: null };
const fita = { id: 'p6', code: 'FVR18', name: 'Fita veda-rosca 18mm', photo_url: null, price_cents: 450, category_id: null };

test('carrinho do Figma: R$ 746,32 bloqueado → ajusta chapa → R$ 456,32', () => {
  let s = emptyCart;
  s = cartReducer(s, { type: 'add', product: metalon, qty: 2, availableQty: 24 });
  s = cartReducer(s, { type: 'setDiscount', productId: 'p1', discount: { type: 'percent', value: 10 } });
  s = cartReducer(s, { type: 'add', product: chapa, qty: 4, availableQty: 3 });
  s = cartReducer(s, { type: 'add', product: fita, availableQty: 65 });
  const a = summarize(s);
  assert.equal(a.gross, 76430); assert.equal(a.discount, 1798); assert.equal(a.total, 74632);
  assert.equal(canCheckout(s), false);
  s = cartReducer(s, { type: 'setQty', productId: 'p2', qty: 2 });
  assert.equal(summarize(s).total, 45632);
  assert.equal(canCheckout(s), true);
});

test('desconto em R$ nunca deixa preço negativo', () => {
  let s = cartReducer(emptyCart, { type: 'add', product: fita, availableQty: null });
  s = cartReducer(s, { type: 'setDiscount', productId: 'p6', discount: { type: 'amount', value: 9999 } });
  assert.equal(summarize(s).total, 0);
});
