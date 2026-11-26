# Prompt — Issue 04: Cache offline do catálogo

Cole no Claude Code (ou outro agente) dentro deste repositório.

---

Repositório: este (ORDO). Trabalhe **somente** na issue "04 · Cache offline do catálogo".
Antes de começar, procure no GitHub deste repositório uma issue com esse título; **se não existir, crie-a** com a descrição e os critérios abaixo e use o número dela no branch e no PR.

Leia AGENTS.md e SPEC.md (§12, item 4). Referência: SPEC §8 (imagens em docs/figma/png/).

Tarefa: Popular product_cache (src/lib/offline/db.ts) quando online e fazer listSaleProducts/searchProducts lerem do cache quando offline.

Critérios de aceite: Com o celular em modo avião, a grade e a busca continuam funcionando.
Também: `npm run typecheck` e `npm test` passam; remova o `SpecPlaceholder` das telas concluídas.

Entregue num branch `issue-04-<resumo>` com um PR que feche a issue.
