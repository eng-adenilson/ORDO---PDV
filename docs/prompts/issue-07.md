# Prompt — Issue 07: Entrada de mercadorias

Cole no Claude Code (ou outro agente) dentro deste repositório.

---

Repositório: este (ORDO). Trabalhe **somente** na issue "07 · Entrada de mercadorias".
Antes de começar, procure no GitHub deste repositório uma issue com esse título; **se não existir, crie-a** com a descrição e os critérios abaixo e use o número dela no branch e no PR.

Leia AGENTS.md e SPEC.md (§12, item 7). Referência: 07, 12, R5 (imagens em docs/figma/png/).

Tarefa: entrada.tsx com 'Produto existente' e 'Produto novo', fornecedor obrigatório, últimas entradas, resultado R5; offline via outbox kind stock_entry.

Critérios de aceite: Saldo soma (nunca substitui); fornecedor obrigatório; funciona offline.
Também: `npm run typecheck` e `npm test` passam; remova o `SpecPlaceholder` das telas concluídas.

Entregue num branch `issue-07-<resumo>` com um PR que feche a issue.
