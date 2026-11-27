import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function findTests(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findTests(full));
    else if (entry.isFile() && full.includes('__tests__') && entry.name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

const files = findTests(resolve('src'));
if (files.length === 0) {
  console.error('Nenhum arquivo de teste encontrado em src/**/__tests__/*.test.ts');
  process.exit(1);
}

const loader = new URL('./ts-loader.mjs', import.meta.url).href;
const res = spawnSync(process.execPath, ['--import', loader, '--test', ...files], { stdio: 'inherit' });
process.exit(res.status ?? 1);
