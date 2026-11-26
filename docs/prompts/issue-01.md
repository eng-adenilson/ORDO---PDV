# Prompt — Issue 01: Configurar Supabase

Cole no Claude Code (ou outro agente) dentro deste repositório.

---

Repositório: este (ORDO). Trabalhe **somente** na issue "01 · Configurar Supabase".
Antes de começar, procure no GitHub deste repositório uma issue com esse título; **se não existir, crie-a** com a descrição e os critérios abaixo e use o número dela no branch e no PR.

Leia AGENTS.md e SPEC.md (§12, item 1). Referência: SPEC §3, §7, §9 (imagens em docs/figma/png/).

Tarefa: Criar o projeto Supabase, aplicar supabase/migrations/0001_schema.sql e 0002_rpc.sql, rodar seed.sql, criar os usuários (login@ordo.local com user_metadata.name) e o bucket product-photos; documentar no README como preencher o .env.

Critérios de aceite: rpc_test.sql passa num banco de teste; o app entra com um usuário real.
Também: `npm run typecheck` e `npm test` passam; remova o `SpecPlaceholder` das telas concluídas.

Entregue num branch `issue-01-<resumo>` com um PR que feche a issue.
