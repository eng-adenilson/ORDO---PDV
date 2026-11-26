# Prompt — Issue 02: Login com Supabase

Cole no Claude Code (ou outro agente) dentro deste repositório.

---

Repositório: este (ORDO). Trabalhe **somente** na issue "02 · Login com Supabase".
Antes de começar, procure no GitHub deste repositório uma issue com esse título; **se não existir, crie-a** com a descrição e os critérios abaixo e use o número dela no branch e no PR.

Leia AGENTS.md e SPEC.md (§12, item 2). Referência: 01-login, R1-login-erro (imagens em docs/figma/png/).

Tarefa: Validar src/app/login.tsx contra o Supabase real, estado de erro R1 (banner + borda na senha), sessão mantida offline após o primeiro login.

Critérios de aceite: Login certo entra; errado mostra R1; reabrir o app sem internet mantém a sessão.
Também: `npm run typecheck` e `npm test` passam; remova o `SpecPlaceholder` das telas concluídas.

Entregue num branch `issue-02-<resumo>` com um PR que feche a issue.
