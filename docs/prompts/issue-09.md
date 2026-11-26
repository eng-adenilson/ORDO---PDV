# Prompt — Issue 09: Histórico e cancelamento

Cole no Claude Code (ou outro agente) dentro deste repositório.

---

Repositório: este (ORDO). Trabalhe **somente** na issue "09 · Histórico e cancelamento".
Antes de começar, procure no GitHub deste repositório uma issue com esse título; **se não existir, crie-a** com a descrição e os critérios abaixo e use o número dela no branch e no PR.

Leia AGENTS.md e SPEC.md (§12, item 9). Referência: 09, 09b, 18 (imagens em docs/figma/png/).

Tarefa: Aba Histórico, vendas/[id] com detalhe, modal de cancelamento com motivo obrigatório (cancel_sale), tela 18 e 'Refazer venda com estes itens'.

Critérios de aceite: Cancelar exige motivo e devolve estoque; venda fica marcada como cancelada.
Também: `npm run typecheck` e `npm test` passam; remova o `SpecPlaceholder` das telas concluídas.

Entregue num branch `issue-09-<resumo>` com um PR que feche a issue.
