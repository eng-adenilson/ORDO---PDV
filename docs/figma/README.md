# Exportações do Figma

Arquivo Figma: **"Untitled"** (`WEZwMHchLqXTY4klN9Y5BJ`), página **Telas — ORDO v1** (telas) e **Logo — ORDO** (conceitos de logo; o escolhido é o **B "Grade"**).

| Pasta | Conteúdo |
|---|---|
| `png/` | cada tela a 720×1600 (2x de 360×800). **Use como referência visual.** |
| `svg/` | exportação vetorial direta do Figma (textos convertidos em curvas: use o PNG/SPEC para os textos) |
| `source/` | `ds.py` (tokens e componentes), `screens.py` (fileira 1) e `flows.py` (fileiras 2 e 3): os geradores que montaram as telas no Figma. Coordenadas (x, y, largura, altura), cores, tamanhos de fonte e textos exatos de cada elemento |
| `node-ids.json` | ID da tela → ID do nó no Figma (para abrir/inspecionar no Dev Mode) |
| `telas-overview.png` | todas as telas numa imagem |

Fileiras no Figma: **1** telas principais (item 11 dos requisitos) · **2** estados e telas complementares · **3** resultados de fluxo (sucesso, erro, vazio, offline).

Para ler medidas: em `source/*.py`, `r(x, y, w, h, cor, raio)` é um retângulo, `t(x, y, texto, tamanho, peso, cor)` é um texto (y = linha de base), `field()`, `button()`, `chip()`, `badge()`, `card()` são os componentes do design system.
