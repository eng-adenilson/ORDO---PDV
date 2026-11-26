# ORDO — Especificação de implementação

> **Para quem vai implementar (pessoa ou IA):** este documento é a fonte da verdade do *como*.
> O *o quê* vem de [`docs/requisitos-v2.0.md`](docs/requisitos-v2.0.md) (requisitos do cliente, v2.0, 23/11/2026).
> Cada tela tem uma imagem de referência em [`docs/figma/png/`](docs/figma/png/) e o vetor exportado do Figma em [`docs/figma/svg/`](docs/figma/svg/).
> Quando este documento e a imagem divergirem, **vale a imagem para visual e este documento para regra**.
> Quando um requisito estiver pendente no documento do cliente (§13 dele), siga a **decisão provisória** da seção 13 abaixo e não invente outra.

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Stack e estrutura do repositório](#2-stack-e-estrutura-do-repositório)
3. [Como rodar](#3-como-rodar)
4. [Design system](#4-design-system)
5. [Telas](#5-telas)
6. [Busca por voz](#6-busca-por-voz)
7. [Autenticação](#7-autenticação)
8. [Offline e sincronização](#8-offline-e-sincronização)
9. [Banco de dados (Supabase)](#9-banco-de-dados-supabase)
10. [Regras de negócio → onde estão garantidas](#10-regras-de-negócio--onde-estão-garantidas)
11. [Dados de exemplo](#11-dados-de-exemplo)
12. [Plano de implementação (issues)](#12-plano-de-implementação-issues)
13. [Pendências do cliente e decisões provisórias](#13-pendências-do-cliente-e-decisões-provisórias)
14. [Definição de pronto e testes](#14-definição-de-pronto-e-testes)

---

## 1. Visão geral

**ORDO** é um PDV (ponto de venda) mobile para Android. Primeiro cliente: uma loja de ferragens; a estrutura deve servir a qualquer comércio (nada de regra específica de ferragem no código — §14 dos requisitos).

Objetivo de produto: **o vendedor registra uma venda com poucos toques**, com busca por texto e por voz, funcionando mesmo sem internet.

Usuários: vendedores no balcão, cada um com login próprio, todos com as mesmas permissões (por enquanto).

Fora do escopo da v1: painel web administrativo, integração com maquininha, importação por planilha, relatórios além do diário, perfis de permissão.

## 2. Stack e estrutura do repositório

| Camada | Escolha | Observação |
|---|---|---|
| App | **Expo SDK 58**, React Native 0.88, React 19.3, TypeScript estrito | `package.json` fixa as versões. Use sempre `npx expo install <pacote>` |
| Navegação | **Expo Router** (rotas em `src/app/`), `typedRoutes` ligado | `Stack.Protected` faz a trava de login |
| Backend | **Supabase** (PostgreSQL + Auth + Storage) | Plano gratuito no início |
| Offline | `expo-sqlite` (fila + cache) e `@react-native-community/netinfo` | Ver §8 |
| Voz | `expo-speech-recognition` (pt-BR) | Exige *development build* (não roda no Expo Go) |
| Código de barras | `expo-camera` (`CameraView`) | |
| Ícones / logo | `react-native-svg` com os mesmos traços do Figma | `src/components/ui/Icon.tsx` |
| Fonte | Inter (`@expo-google-fonts/inter`) 400/500/600/700/800 | |
| Excel | **a escolher** (sugestão: SheetJS `xlsx` gerando no app + `expo-sharing`) | Issue #12 |

```
.
├── SPEC.md                      ← este documento
├── AGENTS.md / CLAUDE.md        ← instruções para agentes de IA
├── docs/
│   ├── requisitos-v2.0.md       ← documento do cliente (não editar)
│   ├── brand/                   ← logo ORDO em SVG (símbolo, branco, ícone do app)
│   └── figma/
│       ├── png/<id>.png         ← referência visual de cada tela (720×1600, 2x)
│       ├── svg/<id>.svg         ← exportação vetorial do Figma (texto em curvas)
│       ├── source/*.py          ← geradores usados para montar o Figma: coordenadas, cores e textos exatos
│       ├── node-ids.json        ← tela → id do nó no arquivo Figma
│       └── README.md
├── src/
│   ├── app/                     ← rotas (cada arquivo = uma tela)
│   ├── components/ui/           ← design system em código (use sempre estes)
│   ├── features/                ← lógica por domínio (auth, cart, sales, voice)
│   ├── data/                    ← repo.ts (acesso a dados) e demo.ts (dados de exemplo)
│   ├── lib/                     ← dinheiro, supabase, offline, voz, conectividade
│   ├── theme/tokens.ts          ← cores, tipografia, espaçamentos
│   └── types/domain.ts          ← tipos de domínio (espelham o SQL)
├── supabase/
│   ├── migrations/0001_schema.sql, 0002_rpc.sql
│   ├── seed.sql
│   └── tests/rpc_test.sql
└── assets/                      ← ícone, ícone adaptativo, splash (gerados do logo)
```

Regras de organização:
- **Telas só falam com dados através de `src/data/repo.ts`.** Nunca `supabase.from(...)` dentro de componente.
- **Dinheiro em centavos (inteiro)** em todo o app e no banco. Formatação só com `formatMoney()` (`src/lib/money.ts`).
- **Cores, fontes e tamanhos só de `src/theme/tokens.ts`.** Nenhum hex solto em tela.
- Componentes de tela em `src/app/**`; peças reutilizáveis de um domínio em `src/features/<domínio>/`.

## 3. Como rodar

```bash
npm install
cp .env.example .env        # opcional: sem .env o app roda em MODO DEMONSTRAÇÃO com dados de exemplo
npx expo start              # Expo Go funciona para quase tudo, exceto voz e câmera
npx expo run:android        # development build (necessário para voz/câmera); ou: npx eas-cli build --profile development
npm run typecheck && npm test
```

Supabase:
1. Crie o projeto e copie URL + anon key para `.env`.
2. Rode `supabase/migrations/0001_schema.sql` e `0002_rpc.sql` (SQL Editor ou `supabase db push`).
3. Opcional: `supabase/seed.sql`.
4. Crie usuários no painel *Authentication*: e-mail `<login>@ordo.local`, senha, e `user_metadata` `{"name": "João"}` (ver §7).
5. Crie o bucket de Storage `product-photos` (público para leitura, escrita para `authenticated`).

APK de distribuição (§1.2 dos requisitos): `npx eas-cli build -p android --profile preview` com `"buildType": "apk"` no `eas.json` (a criar na issue #14).

## 4. Design system

Fonte: Figma, arquivo "Untitled", páginas **Logo — ORDO** e **Telas — ORDO v1**. Já traduzido para `src/theme/tokens.ts` e `src/components/ui/`.

### 4.1 Marca

Logo **"Grade"**: grade 3×3 de quadrados escuros (raio 8 em 56) com o centro vazio, formando um **O**; o quadrado do canto superior direito é **amarelo e girado 15°**: o produto saindo da prateleira. Arquivos: `docs/brand/ordo-symbol.svg`, `ordo-symbol-white.svg`, `ordo-app-icon.svg`. Componente: `<Logo size inverted />`.

### 4.2 Cores (`colors`)

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#1A1A1A` | texto principal, botão primário, chip ativo |
| `ink2` | `#3A3A3A` | rótulo de campo |
| `muted` | `#5F5F5F` | texto secundário (≥ 4.5:1 em branco) |
| `line` | `#E4E2DA` | bordas e divisores |
| `bg` | `#F7F6F2` | fundo das telas |
| `card` | `#FFFFFF` | cartões, campos, barras |
| `brand` | `#F2B705` | ação de destaque: microfone, **Confirmar venda**, **Abrir caixa**. Texto sobre ele: sempre `ink` |
| `brandSoft` | `#FFF4CC` | aba ativa, seleção, avatar |
| `ok` / `okSoft` | `#1E7F4F` / `#E3F3EA` | desconto, sucesso |
| `danger` / `dangerSoft` | `#C62828` / `#FDE8E8` | erro, zerado, cancelada, diferença negativa |
| `warn` / `warnSoft` | `#8A4B00` / `#FDECC8` | offline, estoque baixo, aguardando envio |

### 4.3 Tipografia (`type`)

Inter. `display` 36/800 (total a receber) · `title` 22/800 · `screenTitle` 20/700 · `sheetTitle` 18/700 · `section` 15/700 · `bodyStrong` 14/600 · `body` 14/400 · `input` 15/400 · `button` 16/600 · `label` 13/600 · `caption` 12/500 · `badge` 11/700 · `money` 15/700 com `tabular-nums`.
Dinheiro sempre `R$ 1.240,00` (ponto de milhar, vírgula decimal) via `formatMoney`.

### 4.4 Layout

Tela de referência 360×800 dp. Margem lateral 16. App bar branca com divisor inferior; título 20/700 a 56 dp da esquerda quando há botão voltar. Tab bar 72 dp com 5 abas (**Vender, Estoque, Histórico, Caixa, Mais**); a ativa tem pílula `brandSoft` 56×32 atrás do ícone. Telas de fluxo (carrinho, pagamento, formulários) **não** mostram a tab bar e têm o botão principal fixo no rodapé (altura 56).

### 4.5 Componentes (`src/components/ui`)

| Componente | Notas |
|---|---|
| `Button` | `primary` (ink), `brand` (amarelo), `ghost` (branco com borda), `danger`. 52 dp (56 com `large`). Desabilitado = `#D9D7CF`; diga o motivo perto (`accessibilityHint` + texto na tela) |
| `TextField` | rótulo **sempre visível** acima; `*` em obrigatório; foco = borda ink 2 dp; erro = borda danger + mensagem embaixo dizendo o que fazer; `readOnlyValue` para campo calculado |
| `Chip` | filtros e alternâncias (36 dp, `hitSlop` para 44) |
| `Badge` | selo com texto: `low`, `out`, `ok`, `neutral`, `pending` |
| `Card` | raio 14, borda `line`; `tone="danger"` ou `"selected"` |
| `AppBar`, `Screen` | estrutura de tela; `Screen footer={...}` fixa o botão principal |
| `Stepper` | quantidade inteira; `max` destaca em vermelho quando passa do saldo |
| `BottomSheet` | véu 45%, raio 24; voz, desconto, cliente rápido, exportação |
| `Banner`, `Toast`, `EmptyState`, `ResultScreen`, `Thumb`, `Icon`, `Logo`, `Text` | ver arquivos |
| `SpecPlaceholder` | **marcador da fundação**: some quando a tela for implementada |

### 4.6 Regras de interface (Web Interface Guidelines, aplicadas ao app)

- Alvo de toque ≥ 44 dp.
- Todo campo tem rótulo visível; placeholder só como exemplo (`Ex.: …`).
- Teclado certo: `decimal-pad` para dinheiro e quantidade, `phone-pad` para telefone, `autoCapitalize="none"` no login.
- Erro aparece junto do campo e diz como resolver.
- Ação destrutiva (cancelar venda) pede confirmação em modal que diz a consequência.
- Estados sempre visíveis: carregando, vazio, erro, offline/aguardando envio.
- Nada depende só de cor: selos têm texto; cancelado tem risco **e** selo.
- Botão desabilitado sempre com o motivo visível na tela.
- `accessibilityRole`/`accessibilityLabel` em todo botão só com ícone.

## 5. Telas

**Status:** ✅ implementada como referência · 🧱 rota criada com `SpecPlaceholder` (implementar).
Imagem: `docs/figma/png/<ID>.png` · Vetor: `docs/figma/svg/<ID>.svg`.

| ID | Tela | Rota / arquivo | Status |
|---|---|---|---|
| 01-login | Login | `src/app/login.tsx` | ✅ |
| R1-login-erro | Login com erro | idem | ✅ |
| 02-vendas | Vender (início) | `src/app/(app)/(tabs)/index.tsx` | ✅ |
| 02b…02e | Busca por voz: resultado · ouvindo · sem quantidade · não entendi | `src/features/voice/VoiceSheet.tsx` | ✅ |
| 02f-busca-digitando, 02g-busca-sem-resultado | Busca por texto | `src/app/(app)/busca.tsx` | 🧱 |
| 03-carrinho, 03c-carrinho-desconto, R2-carrinho-vazio | Carrinho e desconto | `src/app/(app)/carrinho.tsx`, `src/features/cart/DiscountSheet.tsx` | ✅ |
| 03b-pagamento, 04-cadastro-rapido-cliente | Pagamento + cliente rápido | `src/app/(app)/pagamento.tsx` | ✅ (falta buscar cliente existente) |
| R3-venda-concluida, R4-venda-salva-offline | Resultado da venda | `src/app/(app)/venda-concluida.tsx` | ✅ |
| 05-clientes | Clientes | `src/app/(app)/clientes/index.tsx` (+ `novo.tsx`) | 🧱 |
| 06-cadastro-produto, R7-produto-codigo-duplicado | Produto (novo/editar) | `src/app/(app)/produtos/novo.tsx`, `[id].tsx` | 🧱 |
| 13-produtos, R8-produtos-produto-salvo | Lista de produtos | `src/app/(app)/produtos/index.tsx` | 🧱 |
| 07-entrada-mercadorias, 12-entrada-produto-novo | Entrada de mercadorias | `src/app/(app)/entrada.tsx` | 🧱 |
| R5-entrada-registrada | Resultado da entrada | `src/app/(app)/entrada-registrada.tsx` | 🧱 |
| 08-consulta-estoque, R9-estoque-exportacao-pronta | Estoque | `src/app/(app)/(tabs)/estoque.tsx` | 🧱 |
| 09-historico-vendas | Histórico | `src/app/(app)/(tabs)/historico.tsx` | 🧱 |
| 09b-venda-cancelar, 18-venda-cancelada | Detalhe da venda / cancelar | `src/app/(app)/vendas/[id].tsx` | 🧱 |
| 10a-abrir-caixa, 10-relatorio-diario-caixa | Caixa (aba) | `src/app/(app)/(tabs)/caixa.tsx` | 🧱 |
| 14-relatorio-do-dia | Relatório completo | `src/app/(app)/relatorio.tsx` | 🧱 |
| 15-fechar-caixa, R6-caixa-fechado | Fechar caixa e resultado | `src/app/(app)/caixa-fechar.tsx`, `caixa-fechado.tsx` | 🧱 |
| 11-mais | Mais | `src/app/(app)/(tabs)/mais.tsx` | 🧱 (botão Sair já funciona) |
| 16-scanner | Leitor de código de barras | `src/app/(app)/scanner.tsx` | 🧱 |
| 17-sincronizacao | Sincronização | `src/app/(app)/sincronizacao.tsx` | 🧱 |

### 5.1 Mapa de navegação

```
login ──(Stack.Protected)──► (tabs)
(tabs)/Vender ─► busca ─► (+ item) ─┐
          └─► VoiceSheet ──────────┤
          └─► barra "Ver carrinho" ─► carrinho ─► pagamento ─► venda-concluida (R3 | R4)
(tabs)/Estoque ─► scanner · exportação (sheet R9)
(tabs)/Histórico ─► vendas/[id] ─(cancelar, modal)─► 18 venda cancelada ─(Refazer)─► carrinho preenchido
(tabs)/Caixa ─ sem sessão: 10a abrir │ com sessão: 10 ─► relatorio · caixa-fechar ─► caixa-fechado (R6)
(tabs)/Mais ─► clientes · produtos(─► novo/[id] ─► scanner) · entrada(─► entrada-registrada) · sincronizacao
```

### 5.2 Especificação por tela

> Para cada tela: abra o PNG, leia esta seção, implemente com os componentes do §4.5 e os dados de `repo.ts`. Coordenadas exatas: `docs/figma/source/screens.py` e `flows.py` (função com o mesmo nome da tela).

**01 Login / R1** · Logo 80, "ORDO" 32/800 com espaçamento 2, subtítulo. Campos Usuário (ícone user) e Senha (ícone lock, `secureTextEntry`). "Esqueci a senha" à direita (sem ação até §13.2 ser definido). Botão Entrar desabilitado com campos vazios. Erro: banner danger "Usuário ou senha incorretos." + borda danger na senha. Rodapé "Versão · funciona sem internet".

**02 Vender** · App bar: logo 28 + "Vender" + nome do vendedor à direita. Campo de busca em destaque (abre `/busca`) com botão de microfone amarelo 48×48. Faixa warn quando offline ou com pendências: "Sem internet · N vendas aguardando envio". Chips de categoria com rolagem horizontal ("Todos" primeiro). Grade 2 colunas: foto (ou placeholder), nome em até 2 linhas, código, preço, botão + (44). **Sem estoque e sem custo nesta tela.** Barra flutuante "Ver carrinho" (contador amarelo, total) aparece quando há itens.

**02b–02e Voz** · ver §6. Sheet com 4 estados: ouvindo (círculo amarelo + ondas, "Cancelar"); resultado ("Você disse: …", até 3–5 produtos, o primeiro pré-selecionado com borda ink 2, selo "Qtd N" se a quantidade foi falada, botões "Falar de novo" e "Adicionar N"); sem quantidade (aviso "Nenhuma quantidade falada · entra com 1"); não entendi (ícone warn, "Digitar" / "Falar de novo").

**02f/02g Busca** · Campo com foco automático e borda ink 2, botão limpar (x) e microfone. Resultados conforme digita (debounce 250 ms): linha com foto, nome, "código · **preço**", botão + 44. Contador "N resultados". Vazio: ícone lupa, "Nada encontrado para “…”", sugestão com chip "Buscar “termo”" (primeira palavra).

**03 Carrinho / 03c / R2** · Subtítulo "N produtos · N unidades". Cartão por item: foto, nome, preço (com desconto: original riscado + final em ok + selo "-10%"), lixeira, `Stepper`, botão "Desc.", total da linha. Item acima do saldo: cartão com borda danger, quantidade em vermelho, "Disponível: N", e banner danger "<produto>: só N em estoque · Ajuste a quantidade para finalizar". Rodapé: Subtotal, Descontos (ok), **Total** 22/800, botão "Ir para pagamento" desabilitado se houver item acima do saldo. Desconto (sheet): alternar "Em R$" / "Em %", campo, cartão com preço original riscado, preço final (un) e economia no item; "Remover" / "Aplicar". Vazio: estado vazio + "Buscar por voz" (brand) + "Voltar para produtos".

**03b Pagamento / 04** · Cartão "Total a receber" com valor 36/800. Grade 2×2: Pix, Dinheiro, Crédito, Débito (selecionado: fundo brandSoft, borda ink 2, check). "Cliente (opcional)": campo que abre a busca/cadastro rápido. Cartão-resumo (itens, desconto, vendedor, "Estoque será baixado ao confirmar"). Botão **Confirmar venda** (brand). Cliente rápido (sheet): Nome*, Telefone* (máscara), "Salvar e usar nesta venda". **A venda pode ser concluída sem cliente.**

**R3 / R4 Resultado da venda** · `ResultScreen`. R3: check verde, "Venda concluída", "Venda #N registrada e estoque atualizado", resumo; "Ver detalhes da venda" / **Nova venda**. R4 (offline): ícone nuvem riscada warn, "Venda salva", "A venda #N ficou guardada neste celular", banner "Estoque confirmado quando a internet voltar"; "Ver sincronização" / **Nova venda**.

**05 Clientes** · Busca por nome ou telefone; linha com avatar (inicial em brandSoft), nome, "telefone · N compras", chevron. "+" na app bar → novo cliente (mesmos campos do sheet rápido).

**06 Produto / R7** · Foto opcional (câmera ou galeria). Nome*, Código* "· único" com botão leitor de código de barras, Categoria (seletor), Status (switch Ativo/Inativo), Preço de custo, Preço de venda (texto auxiliar: "Custo não aparece na tela de vendas · margem N%"), Descrição. Aviso: "O estoque inicial entra pela tela Entrada de mercadorias." Código duplicado (R7): rótulo vira danger "Código * · já usado por <produto>", borda danger, botão Salvar desabilitado. Detecte pelo erro `23505` do insert ou checando antes.

**13 Produtos / R8** · Busca + leitor; chips Ativos / Inativos / categorias. Linha: foto, nome, "código · categoria", preço; selo "Inativo" e texto em muted para inativos. "+" → novo. Após salvar: toast "Produto salvo · <nome>" com ação "Ver".

**07 / 12 Entrada de mercadorias / R5** · Alternância "Produto existente" | "Produto novo". Existente: cartão do produto escolhido (nome, "código · em estoque: N", "Trocar"); Qtd recebida* (foco), **Novo saldo** somente leitura "3 + 20 = 23"; Preço de custo e de venda (pré-preenchidos, editáveis); Fornecedor* (seletor, permite criar pelo nome); "Últimas entradas deste produto" (data, fornecedor, custo, +qtd). Novo: Nome*, Código* + leitor, Categoria, preços, Qtd recebida*, Estoque inicial (somente leitura), Fornecedor*, foto opcional; botão "Cadastrar e registrar entrada". R5: "Entrada registrada", "N unidades somadas ao estoque", saldo antigo → novo em ok, custo, fornecedor; "Ver estoque" / **Registrar outra entrada**.

**08 Estoque / R9** · Subtítulo "Somente consulta · atualizado agora"; ícone exportar na app bar. 6 totalizadores em grade 3×2 (Produtos, Unidades, Valor a custo, Valor de venda, Sem estoque em danger, Estoque baixo em warn), abreviando valores grandes ("R$ 184,2 mil"). Busca por nome/código + leitor; chips Todos / Baixo / Zerado. Linha: nome, código, selo, "N un" à direita; zerado com fundo dangerSoft. **Nenhuma ação de alterar saldo.** Exportar: gera `.xlsx` e abre sheet "Exportação pronta" (nome do arquivo, nº de produtos, compartilhar/salvar).

**09 Histórico** · Subtítulo "Hoje, dd/mm · N vendas". Chips Hoje / Ontem / 7 dias / Canceladas. Cartão: "Venda #N", "hora · vendedor · pagamento", valor à direita; cancelada: valor em muted riscado + selo "Cancelada"; pendente de envio: selo "Aguardando envio".

**09b / 18 Venda** · Detalhe: vendedor, cliente, pagamento; itens "qtd × preço" (+ selo de desconto) e total da linha; descontos; Total. Texto: "Vendas finalizadas não podem ser editadas. Para corrigir, cancele e faça uma nova venda." Botão "Cancelar venda" (ghost) → modal com ícone alerta, "Cancelar venda #N?", consequência ("Os N itens voltam ao estoque…"), **Motivo do cancelamento*** (erro se vazio: "Informe o motivo para continuar."), "Voltar" / "Cancelar venda" (danger). Após cancelar (18): toast "Cancelada · N itens de volta ao estoque", faixa dangerSoft "CANCELADA às hh:mm por <nome>" + motivo, valores em muted e total riscado, botão **Refazer venda com estes itens** (coloca os itens no carrinho).

**10a Abrir caixa** · Cartão brandSoft com logo, "Bom dia, <nome>". Valor inicial para troco* (dinheiro) com atalhos R$ 50 / 100 / 150 / 200. "Último fechamento" (data, responsável, contado, diferença). Botão **Abrir caixa** (brand).

**10 Caixa de hoje** · Subtítulo "Aberto às hh:mm por <nome> · troco R$ X". Cartão escuro: Vendas líquidas (28/800 branco), "N vendas · N canceladas · N vendedores", logo branco. Três cartões: Bruto, Descontos, Cancelado (danger). "Por forma de pagamento" (Pix, Dinheiro, Crédito, Débito) + link "Relatório completo ›". Bloco Fechamento (esperado, contado, diferença). Botões "Exportar Excel" / **Fechar caixa**.

**14 Relatório do dia** · Produtos vendidos (top 4 + "Ver todos os N produtos ›"), Cancelamentos (venda, motivo, valor em danger), Por vendedor (avatar, nº de vendas, total). Botão **Exportar Excel**. Fonte: RPC `daily_report`.

**15 Fechar caixa / R6** · Cartão: Troco inicial, + Vendas em dinheiro, **Esperado na gaveta**. Campo "Quanto você contou na gaveta?"* (foco), dica "Conte as notas e moedas antes de digitar." Ao digitar: banner da diferença: falta (danger), sobra (warn) ou "Caixa confere" (ok). Observação opcional. "Contar de novo" / **Confirmar fechamento**. R6: ícone cadeado em brandSoft, "Caixa fechado", "Fechado às hh:mm por <nome>", resumo com diferença em danger; "Exportar relatório Excel" / **Concluir**. Fechar **não** é obrigatório (§10.3 dos requisitos).

**11 Mais** · Cartão do usuário (avatar, nome, "Vendedor", "Sair" em danger). Itens: Clientes, Produtos, Entrada de mercadorias, Sincronização (subtítulo warn com pendências).

**16 Scanner** · Fundo `#111`, botão fechar, título "Ler código de barras", moldura branca 280×180 com linha amarela, "Aponte para o código do produto · A leitura é automática", botão "Digitar código". Ao ler: vibração curta e volta com o código para a tela de origem.

**17 Sincronização** · Subtítulo "Sem internet desde hh:mm" ou "Online". Faixa warn "N vendas guardadas neste celular · Envio automático quando a internet voltar". "Aguardando envio" (outbox pending/failed). **"Precisa de atenção"**: itens `rejected` com o motivo do servidor (ex.: "Cimento CP-II 50kg ficou sem estoque em outro aparelho") e ações "Ver venda" / "Tentar de novo". "Enviado hoje: N vendas · N entradas · última às hh:mm". Botão **Tentar enviar agora**.

## 6. Busca por voz

- Botão de microfone na tela Vender e na Busca. Cada toque **inicia uma busca nova e descarta a anterior** (§4.1 dos requisitos).
- Reconhecimento: `expo-speech-recognition`, `lang: 'pt-BR'`, `interimResults: true` (mostra a fala ao vivo no estado "Ouvindo…").
- Interpretação: `src/lib/voice/parseQuery.ts` (puro, com testes):
  - quantidade só no **início** ("2 metalon…", "duas chapas…") ou seguida de "unidades/peças/un" ("…, 3 unidades");
  - números no meio são medida/bitola ("chapa **20**" → bitola 20, sem quantidade);
  - "30 **por** 20" → `30x20`; "100 milímetros" → `100mm`; acentos e plural removidos; "de/do/da" ignorados.
- A busca usa os mesmos tokens no app (`searchTokens`) e no banco (`search_products`).
- **Nunca adicionar ao carrinho sem toque do vendedor.** Sem quantidade falada → entra com 1 e o vendedor ajusta no carrinho.
- Melhorias futuras (§4.2 dos requisitos menciona a qualidade do catálogo): tabela de sinônimos ("metalon" = "tubo retangular"), apelidos por produto.

## 7. Autenticação

- Login obrigatório; `Stack.Protected` em `src/app/_layout.tsx`.
- Supabase Auth com e-mail e senha. O campo **Usuário** aceita `joao.balcao` e o app converte para `joao.balcao@ordo.local` (`toEmail`). Crie os usuários assim. O nome exibido vem de `user_metadata.name`; o trigger `handle_new_user` cria o `profiles`.
- Sessão persistida em AsyncStorage (funciona offline depois do primeiro login).
- **Modo demonstração**: sem `.env`, qualquer login entra como "João" com `src/data/demo.ts`.
- Pendente (§13.2): recuperação de senha, regras de sessão, encerramento remoto. Não implementar sem decisão.

## 8. Offline e sincronização

Princípio: **o servidor é a fonte da verdade do estoque.** O app nunca baixa estoque localmente de forma definitiva.

| Operação | Offline? | Como |
|---|---|---|
| Login | só se já houver sessão salva | Supabase persiste a sessão |
| Buscar produtos / ver grade | ✅ | `product_cache` no SQLite, atualizado quando online (issue #4) |
| Vender | ✅ | vai para `outbox` (kind `sale`) com `client_id`; tela R4 |
| Cancelar venda | ✅ (só venda já sincronizada) | `outbox` kind `cancel_sale` |
| Entrada de mercadorias | ✅ | `outbox` kind `stock_entry` |
| Cadastrar produto/cliente | ❌ na v1 | exige internet (avisar) |
| Abrir/fechar caixa, relatórios, estoque | ❌ na v1 | exige internet (avisar) |

Fluxo:
1. `repo.finalizeSale` tenta a RPC; sem rede (ou erro de rede) grava na `outbox` (`src/lib/offline/outbox.ts`).
2. `startAutoSync()` (layout raiz) escuta o NetInfo; ao voltar a conexão chama `syncOutbox()` em ordem de criação, com novas tentativas e espera crescente (5 s → até 5 min).
3. Idempotência: `client_id` é único no banco; reenviar não duplica.
4. Resposta de regra (`P0001`, ex.: sem estoque) → status `rejected` e o item aparece em **Sincronização › Precisa de atenção**; o vendedor decide (refazer com outra quantidade ou descartar).
5. Aviso discreto: faixa warn na tela Vender + contador em Mais › Sincronização.

## 9. Banco de dados (Supabase)

Arquivos: `supabase/migrations/0001_schema.sql` (tabelas, RLS, gatilhos) e `0002_rpc.sql` (funções). **Testado em PostgreSQL 16** com `supabase/tests/rpc_test.sql`, incluindo dois aparelhos vendendo a última unidade ao mesmo tempo (um conclui, o outro recebe "só 0 em estoque", saldo nunca fica negativo).

Tabelas: `profiles`, `categories`, `suppliers`, `customers`, `products` (código único, `stock_qty ≥ 0`, `min_stock`), `sales` (`number` sequencial, `client_id` único, status, motivo obrigatório se cancelada), `sale_items` (nome e preço congelados), `stock_entries` (fornecedor obrigatório), `stock_movements` (auditoria de toda mudança de saldo), `cash_sessions` (no máximo uma aberta). View `sale_products` (**sem custo**).

RPCs (chamar com `supabase.rpc(nome, { payload })` ou argumentos nomeados):

| Função | Faz |
|---|---|
| `search_products(q)` | busca tolerante (tokens, `30 por 20`, acentos) |
| `finalize_sale(payload)` | valida estoque com lock, **usa o preço do servidor**, aplica desconto por item, grava venda e itens, baixa estoque, vincula ao caixa aberto. Idempotente por `client_id` |
| `cancel_sale(payload)` | exige motivo, devolve estoque, marca cancelada (mantém o registro) |
| `register_stock_entry(payload)` | soma ao saldo, atualiza custo/preço, exige fornecedor (cria pelo nome), cadastra produto novo no mesmo fluxo |
| `stock_summary()` | os 6 totalizadores |
| `open_cash_session(opening_cents)` / `close_cash_session(counted_cents, note)` | abertura e fechamento; esperado = troco + vendas em dinheiro não canceladas |
| `daily_report(day)` | relatório do dia já descontando cancelamentos |

Segurança: RLS ligada em tudo; vendas, estoque e caixa **só mudam via RPC** (`security definer`); um gatilho bloqueia `UPDATE` direto de `stock_qty`. Todos os autenticados têm as mesmas permissões (§1.3); quando houver perfis, troque as policies e cheque o papel dentro das RPCs.

Backup (§1.5, §13.8): antes de produção, confira o que o plano contratado oferece de backup e restauração; se não bastar, agende um `pg_dump` diário.

## 10. Regras de negócio → onde estão garantidas

| Regra (§12 dos requisitos) | Garantia |
|---|---|
| Base centralizada | Supabase; app usa `repo.ts` |
| Login obrigatório | `Stack.Protected` |
| Mesmas permissões | policies `authenticated` |
| Código único | `products.code unique` + tela R7 |
| Só nome e código obrigatórios | `not null` só nesses campos |
| Custo fora da tela de venda | view `sale_products`, tipo `SaleProduct` sem `cost_cents` |
| Estoque inteiro | `integer`, `Stepper` inteiro |
| Estoque não editável na consulta | tela sem ação + gatilho `guard_stock_update` |
| Entrada em tela própria | rota `entrada` + RPC `register_stock_entry` |
| Validar estoque / não vender acima | aviso no carrinho (`canCheckout`) **e** validação final em `finalize_sale` |
| Baixa automática | `finalize_sale` |
| Desconto por item | `CartItem.discount`, `sale_items.discount_*` |
| Voz não adiciona sozinha | `VoiceSheet` exige toque + "Adicionar" |
| Cliente opcional | `customer_id` nulo permitido |
| Cancelamento com motivo e devolução | `cancel_sale` + `check cancel_needs_reason` |
| Venda não editável | sem policy de update em `sales`; só cancelar e refazer |
| Sincronização posterior | `outbox` + `syncOutbox` |
| Excel só para exportar | nada lê Excel; exportação gera arquivo |

## 11. Dados de exemplo

Usados no Figma, em `src/data/demo.ts` e em `supabase/seed.sql`. Mantenha a coerência ao criar novas telas.

- Vendedores: **João** (`joao.balcao`), **Carla**.
- Produtos: Metalon 30x20 #18 6m (MET3020, R$ 89,90, 24 un) · Chapa galvanizada nº 20 (CHG20, R$ 145,00, 3 un, baixo) · Tubo PVC 100mm 6m (PVC100, R$ 79,50, 12) · Cimento CP-II 50kg (CIM50, R$ 38,90, zerado) · Disco de corte 7" (DSC7, R$ 12,90, 40) · Fita veda-rosca 18mm (FVR18, R$ 4,50, 65) · Parafuso sextavado 1/4" (PSX14-2, R$ 0,45) · Torneira plástica 1/2" (TRN12, inativo).
- Venda **#1048**: Metalon 2 × R$ 80,91 (-10%) + Chapa 2 × R$ 145,00 + Fita 1 × R$ 4,50 = **R$ 456,32**, Pix, cliente Marcos Pereira. (Carrinho antes do ajuste: chapa 4 → R$ 746,32, bloqueado por estoque.)
- Caixa do dia: aberto 08:02 por Carla, troco R$ 150,00; líquido **R$ 3.842,70** (Carla R$ 2.104,10 + João R$ 1.738,60); bruto R$ 3.958,20; descontos R$ 115,50; cancelado R$ 1.329,90 (#1046 R$ 1.240,00 "Cliente desistiu da compra" + #1039 R$ 89,90 "Lançado em duplicidade"); Pix 1.984,30 · Dinheiro 812,40 · Crédito 640,00 · Débito 406,00; esperado em dinheiro R$ 962,40, contado R$ 952,40, **diferença − R$ 10,00**.

## 12. Plano de implementação (issues)

Uma issue = um PR. Ordem sugerida (cada uma depende das anteriores só onde indicado):

1. **Supabase** — criar projeto, aplicar migrations, seed, usuários, bucket `product-photos`; preencher `.env`. Aceite: `rpc_test.sql` passa num banco de teste.
2. **Login real** — testar `signIn` com Supabase; erro R1; manter sessão offline.
3. **Busca por texto (02f/02g)** — `busca.tsx` com debounce, resultados, vazio; reusar `VoiceSheet`.
4. **Cache offline do catálogo** — popular `product_cache` ao abrir online; `listSaleProducts`/`searchProducts` leem do cache quando offline.
5. **Cliente existente no pagamento + telas de Clientes (05)** — `repo.searchCustomers`, `createCustomer`.
6. **Produtos (13, 06, R7, R8)** — lista, formulário novo/editar, foto (Storage), código duplicado, scanner (16).
7. **Entrada de mercadorias (07, 12, R5)** — existente e novo, fornecedor, últimas entradas; offline via outbox.
8. **Estoque (08)** — `stock_summary`, lista com filtros e selos.
9. **Histórico e venda (09, 09b, 18)** — lista com filtros, detalhe, cancelar com motivo, refazer venda.
10. **Caixa (10a, 10, 15, R6) e Relatório (14)** — RPCs de caixa e `daily_report`.
11. **Sincronização (17)** — lista da outbox, rejeitados, "Tentar enviar agora"; contador em Mais.
12. **Exportar Excel (R9, 10, 14)** — escolher lib, gerar `.xlsx`, compartilhar.
13. **Polimento de acessibilidade** — rever §4.6 em todas as telas; leitor de tela no Android (TalkBack).
14. **Build e distribuição** — `eas.json` com perfil APK, ícone/splash, versão.

## 13. Pendências do cliente e decisões provisórias

| Pendência (§13 dos requisitos) | Decisão provisória nesta base |
|---|---|
| Operações offline | tabela do §8 |
| Conflito de estoque entre aparelhos | servidor decide com lock; perdedor vira `rejected` em Sincronização |
| Critério de estoque baixo | `stock_qty ≤ min_stock` (por produto); sem `min_stock` usa 5 |
| Perdas, avarias, ajuste de inventário | **não implementar**; `stock_movements` já prevê novos `reason` |
| Fornecedores | só nome; cria pelo nome na entrada |
| Devolução parcial, troca | **não implementar**; só cancelamento total |
| Retiradas, reforços, despesas de caixa | **não implementar** |
| Mais de um caixa aberto | proibido (índice único) |
| Perfis e permissões | todos iguais; ver §9 para quando mudar |
| Recuperação de senha | botão visível sem ação |
| Voz: quantidade falada | 1 quando não falada; "Qtd N" quando falada no início ou com "unidades" |
| Login | `usuario@ordo.local` no Supabase Auth |

## 14. Definição de pronto e testes

Uma tela está pronta quando:
- confere com o PNG (mesma hierarquia, textos, cores dos tokens, espaçamentos de 4 em 4);
- usa só componentes de `src/components/ui` e dados de `repo.ts`;
- tem os estados: carregando, vazio, erro, offline (quando se aplica);
- cumpre o §4.6 (toque ≥ 44, rótulos, teclado certo, motivo de botão desabilitado);
- `npm run typecheck` e `npm test` passam; o `SpecPlaceholder` foi removido.

Testes existentes:
- `npm test` → `src/lib/voice/__tests__/parseQuery.test.ts` (interpretação da voz) e `src/features/cart/__tests__/cart.test.ts` (carrinho do Figma: R$ 746,32 bloqueado → R$ 456,32).
- `supabase/tests/rpc_test.sql` → regras do banco (estoque, preço, desconto, idempotência, cancelamento, caixa, relatório, busca).
- `npx expo export --platform android` gera o bundle sem erro.
