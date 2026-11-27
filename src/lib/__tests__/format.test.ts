import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMoneyShort, maskPhone, plural } from '../format.ts';

test('máscara de telefone', () => {
  assert.equal(maskPhone('61981120'), '(61) 9811-20');
  assert.equal(maskPhone('61998112034'), '(61) 9 9811-2034');
  assert.equal(maskPhone('6133441200'), '(61) 3344-1200');
  assert.equal(maskPhone(''), '');
});
test('valores grandes abreviados', () => {
  assert.equal(formatMoneyShort(18_420_000), 'R$ 184,2 mil');
  assert.equal(formatMoneyShort(250_000_000), 'R$ 2,5 mi');
  assert.match(formatMoneyShort(384270), /^R\$\s?3\.842,70$/);
});
test('plural', () => { assert.equal(plural(1, 'venda', 'vendas'), '1 venda'); assert.equal(plural(3, 'venda', 'vendas'), '3 vendas'); });
