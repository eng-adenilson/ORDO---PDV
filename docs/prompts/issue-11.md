# Prompt — Issue 11: Tela de sincronização

Cole no Claude Code (ou outro agente) dentro deste repositório.

---

Repositório: este (ORDO). Trabalhe **somente** na issue "11 · Tela de sincronização".
Antes de começar, procure no GitHub deste repositório uma issue com esse título; **se não existir, crie-a** com a descrição e os critérios abaixo e use o número dela no branch e no PR.

Leia AGENTS.md e SPEC.md (§12, item 11). Referência: 17-sincronizacao, 11-mais (imagens em docs/figma/png/).

Tarefa: sincronizacao.tsx lendo a outbox: aguardando, rejeitados com motivo e ações, enviados hoje, 'Tentar enviar agora'; contador em Mais.

Critérios de aceite: Venda feita offline aparece, é enviada ao voltar a internet e some da lista.
Também: `npm run typecheck` e `npm test` passam; remova o `SpecPlaceholder` das telas concluídas.

Entregue num branch `issue-11-<resumo>` com um PR que feche a issue.
