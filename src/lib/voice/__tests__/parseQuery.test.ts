// Rode com: npm test   (node --test com remoção de tipos, sem dependências extras)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVoiceQuery } from '../parseQuery.ts';

const cases: [string, number | null, string][] = [
  ['2 metalon 30 por 20', 2, 'metalon 30x20'],
  ['Metalon 30 por 20', null, 'metalon 30x20'],
  ['duas chapas 20', 2, 'chapa 20'],
  ['chapa 20', null, 'chapa 20'],
  ['tubo de PVC de 100 milímetros', null, 'tubo pvc 100mm'],
  ['metalon 30 por 20, 3 unidades', 3, 'metalon 30x20'],
  ['dez discos de corte', 10, 'disco corte'],
];
for (const [input, qty, query] of cases) {
  test(input, () => assert.deepEqual(parseVoiceQuery(input), { qty, query }));
}
