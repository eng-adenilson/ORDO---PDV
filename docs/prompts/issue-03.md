# Prompt — Issue 03: Busca por texto

Cole no Claude Code (ou outro agente) dentro deste repositório.

---

Repositório: este (ORDO). Trabalhe **somente** na issue "03 · Busca por texto".
Antes de começar, procure no GitHub deste repositório uma issue com esse título; **se não existir, crie-a** com a descrição e os critérios abaixo e use o número dela no branch e no PR.

Leia AGENTS.md e SPEC.md (§12, item 3). Referência: 02f-busca-digitando, 02g-busca-sem-resultado (imagens em docs/figma/png/).

Tarefa: Implementar src/app/(app)/busca.tsx: foco automático, resultados conforme digita (debounce 250 ms) via repo.searchProducts, linha com foto/nome/código·preço/botão +, vazio com sugestão, microfone abrindo a VoiceSheet.

Critérios de aceite: Confere com os PNGs; sem estoque e sem custo na tela.
Também: `npm run typecheck` e `npm test` passam; remova o `SpecPlaceholder` das telas concluídas.

Entregue num branch `issue-03-<resumo>` com um PR que feche a issue.
