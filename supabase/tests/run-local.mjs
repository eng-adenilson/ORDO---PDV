// Executa migrations + seed + supabase/tests/rpc_test.sql localmente em PostgreSQL embutido (PGlite).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';

const read = (rel) => readFileSync(resolve(rel), 'utf8');

const db = await PGlite.create({ extensions: { pg_trgm, unaccent } });

// Emula o mínimo do schema `auth` e papel `authenticated` do Supabase para testar localmente.
await db.exec(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated nologin;
    end if;
  end $$;
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb
  );
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $$;
`);

await db.exec(read('supabase/migrations/0001_schema.sql'));
await db.exec(read('supabase/migrations/0002_rpc.sql'));
await db.exec(read('supabase/seed.sql'));

const results = await db.exec(read('supabase/tests/rpc_test.sql'));
const passed = results.some((r) => r.rows?.some((row) => row.resultado === 'TODOS OS TESTES PASSARAM'));

if (!passed) {
  console.error('rpc_test.sql não retornou TODOS OS TESTES PASSARAM');
  process.exit(1);
}

console.log('SQL local (0001_schema + 0002_rpc + seed + rpc_test): TODOS OS TESTES PASSARAM');
