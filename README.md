# ORDO — PDV mobile

Ponto de venda para Android (Expo + Supabase), começando por uma loja de ferragens. Venda rápida com busca por texto e voz, estoque centralizado, caixa e relatório diário, funcionando sem internet.

![Telas](docs/figma/telas-overview.png)

## Comece por aqui
- **[SPEC.md](SPEC.md)**: especificação completa para implementar (pessoas e IA).
- **[docs/figma/](docs/figma/)**: as 37 telas exportadas do Figma (PNG e SVG).
- **[docs/requisitos-v2.0.md](docs/requisitos-v2.0.md)**: requisitos do cliente.
- **[AGENTS.md](AGENTS.md)**: regras para agentes de IA (Claude Code, Codex, Cursor…).

## Rodar localmente (sem nuvem e sem login Google)
```bash
npm install
npx expo start            # sem .env roda em modo local com dados de exemplo
npm run typecheck && npm test
npm run test:sql          # roda 0001_schema, 0002_rpc, seed e rpc_test no PostgreSQL local (PGlite)
```
Sem `.env`, o app usa **autenticação local persistida no aparelho** (sem Google e sem internet):
- Usuários iniciais: `joao.balcao` (João) e `carla` (Carla), senha padrão `123456`.
- Também é possível criar novos usuários locais na própria tela de login em **Criar usuário local**.

## Configurar `.env` e Supabase (opcional / produção)
1. Copie `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
2. No painel do seu projeto Supabase, abra **Settings → API** (ou `supabase status` se usar Supabase local) e preencha no `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL`: **Project URL** (ex.: `https://abcdefghijkl.supabase.co`)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: **anon / public key**
   > Não commite o arquivo `.env` (ele já está listado no `.gitignore`). Sem essas variáveis preenchidas, o app permanece em modo local.
3. No **SQL Editor** do Supabase (ou via `supabase db push`), aplique na ordem:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rpc.sql`
   - `supabase/seed.sql` (opcional, dados iniciais de demonstração)
   - `supabase/storage.sql` (cria o bucket público `product-photos` e suas policies para `authenticated`)
4. Em **Authentication → Users**, crie os vendedores com e-mail no formato `<login>@ordo.local` (ex.: `joao.balcao@ordo.local`, `carla@ordo.local`) e `User Metadata` `{"name": "João"}` (ver SPEC §7).
5. Para validar as regras do banco em um PostgreSQL externo de teste:
   ```bash
   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rpc_test.sql
   ```

Configuração de voz e câmera: SPEC §3.

## O que já está pronto
- Projeto Expo SDK 58 + Expo Router com **todas as rotas** das telas, trava de login e abas.
- Design system em código (tokens + 18 componentes) idêntico ao Figma; ícone e splash a partir do logo.
- Login local persistido em `AsyncStorage` (sem Google) + suporte a Supabase Auth via `.env`.
- Fluxo de venda completo de referência: login → vender (grade, categorias, voz) → carrinho (desconto por item, bloqueio por estoque) → pagamento (cliente rápido) → venda concluída / salva offline.
- Banco Supabase: tabelas, RLS, funções de venda, cancelamento, entrada, caixa e relatório, validadas em PostgreSQL 16 e no runner local (`npm run test:sql`, inclui venda simultânea da última unidade).
- Fila offline com sincronização automática e idempotente.
- Testes: autenticação local, interpretação da voz e cálculo do carrinho (`npm test`), regras do banco (`npm run test:sql` / `supabase/tests/rpc_test.sql`).

O restante está organizado em 14 issues no SPEC §12, com um prompt pronto por issue em [`docs/prompts/`](docs/prompts/).
