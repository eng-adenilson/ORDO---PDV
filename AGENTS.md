# AGENTS.md — ORDO

Você está trabalhando no **ORDO**, PDV mobile (Android) em Expo + Supabase.

## Leia antes de codar
1. **`SPEC.md`**: especificação completa (design system, telas, regras, banco, offline, plano de issues).
2. A imagem da tela em **`docs/figma/png/<ID>.png`** (IDs na tabela do SPEC §5). Abra a imagem: é a referência visual.
3. Coordenadas, cores e textos exatos: `docs/figma/source/screens.py` e `flows.py` (função com o nome da tela).
4. Requisitos do cliente: `docs/requisitos-v2.0.md`. Itens pendentes seguem o SPEC §13; não invente regra nova.

## Regras do projeto
- Uma issue por vez, um PR por issue (SPEC §12). Ao terminar uma tela, remova o `SpecPlaceholder` dela.
- Use **somente** `src/theme/tokens.ts` para cores, fontes e tamanhos, e os componentes de `src/components/ui`.
- Telas acessam dados só por `src/data/repo.ts`. Novas consultas vão para lá, com caminho demo (`isDemo`) e real.
- Dinheiro em **centavos** (inteiro); exiba com `formatMoney`. Estoque em unidades inteiras.
- Estoque, vendas, cancelamentos, entradas e caixa mudam **só por RPC** do Supabase (`supabase/migrations/0002_rpc.sql`). Nunca `update products set stock_qty` pelo app.
- A tela de vendas nunca mostra custo nem estoque. A voz nunca adiciona ao carrinho sem toque do vendedor.
- Toque ≥ 44 dp, rótulo visível em todo campo, erro junto do campo, motivo de botão desabilitado (SPEC §4.6).
- Textos da interface em português do Brasil, iguais aos do PNG.
- Antes de concluir: `npm run typecheck` e `npm test`. Mudou SQL? Rode `supabase/tests/rpc_test.sql` num banco de teste.

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
