DOCUMENTO DE REQUISITOS — SISTEMA PDV MOBILE

Versão: 2.0
Data de atualização: 23 de novembro de 2026
Status: Requisitos consolidados para desenvolvimento

⸻

1. APRESENTAÇÃO DO PROJETO

1.1. Objetivo

Desenvolver um sistema de Ponto de Venda (PDV) para dispositivos móveis, com uma interface simples, intuitiva e funcional, permitindo o gerenciamento de vendas, produtos, estoque, clientes e movimentações financeiras.

O sistema será desenvolvido inicialmente para atender às necessidades de uma loja de ferragens, mas deverá possuir uma estrutura genérica, permitindo sua utilização futura em outros segmentos comerciais.

A prioridade é oferecer uma experiência prática para o vendedor, reduzindo o tempo necessário para registrar uma venda e facilitando o acesso às informações essenciais da operação.

1.2. Plataforma e tecnologia

O sistema será desenvolvido utilizando React Native com Expo, permitindo a execução em dispositivos Android e facilitando os testes durante o desenvolvimento por meio do Expo Go.

A distribuição inicial está prevista para Android, com geração de um arquivo APK para instalação nos dispositivos.

O aplicativo mobile será a prioridade do projeto. Um painel administrativo acessível pelo computador poderá ser desenvolvido futuramente, mas não fará parte do escopo inicial.

1.3. Usuários e acesso

O sistema deverá permitir o acesso de vários vendedores, cada um utilizando suas próprias credenciais.

O login será obrigatório para utilização do aplicativo.

Inicialmente, todos os usuários terão as mesmas permissões, sem diferenciação de níveis de acesso. A implementação de permissões específicas para determinadas operações, como cancelamento de vendas e abertura ou fechamento de caixa, ficará para uma etapa futura.

1.4. Funcionamento online e offline

O aplicativo deverá funcionar tanto online quanto offline, permitindo que determinadas operações sejam realizadas mesmo sem conexão com a internet.

As operações realizadas offline deverão ser armazenadas localmente no dispositivo e sincronizadas automaticamente com o banco de dados central assim que a conexão for restabelecida.

Caso ocorra alguma falha durante a sincronização, o sistema deverá realizar novas tentativas e apresentar um aviso discreto ao usuário.

A arquitetura deverá considerar possíveis conflitos entre dispositivos, especialmente em operações que envolvam estoque. A validação e a baixa de estoque deverão ser centralizadas para evitar inconsistências decorrentes de vendas simultâneas realizadas em aparelhos diferentes.

As operações que poderão ser executadas integralmente offline e as regras específicas para resolução de conflitos ainda serão definidas.

1.5. Banco de dados e armazenamento

O sistema utilizará um banco de dados centralizado na nuvem, garantindo que todos os dispositivos trabalhem com uma base de informações compartilhada.

Foi definido inicialmente o uso do Supabase com PostgreSQL, começando pelo plano gratuito, com possibilidade de migração para um plano pago conforme a necessidade do projeto.

O Excel não será utilizado como banco de dados operacional. Sua utilização ficará destinada à exportação, consulta e análise das informações.

Antes da implantação em ambiente de produção, deverão ser avaliados os limites do plano contratado, a estratégia de backup e os mecanismos de recuperação dos dados.

⸻

2. CADASTRO E GERENCIAMENTO DE PRODUTOS

2.1. Cadastro de produtos

O sistema deverá permitir o cadastro manual de produtos, inicialmente sem necessidade de importação por planilhas.

Cada produto deverá possuir os seguintes campos:

* Nome do produto;
* Código do produto;
* Categoria;
* Descrição;
* Fotografia, de forma opcional;
* Preço de custo;
* Preço de venda;
* Quantidade disponível em estoque;
* Status do produto (ativo ou inativo).

Somente o nome e o código serão obrigatórios no cadastro.

O código deverá ser único para cada produto e poderá ser informado manualmente ou identificado por meio da leitura de código de barras utilizando a câmera do dispositivo.

As categorias serão inicialmente pré-definidas, mas deverão permitir expansão conforme a necessidade da loja.

O preço de custo deverá ser armazenado para consultas e gerenciamento, mas não deverá ser exibido na tela de venda.

O controle de estoque será realizado por unidades inteiras, sem fracionamento.

A importação de produtos por planilha poderá ser considerada futuramente, mas não será uma funcionalidade obrigatória da primeira versão.

2.2. Busca de produtos

A busca deverá permitir localizar produtos pelo nome, com apresentação dos resultados conforme o usuário digita.

Os resultados deverão apresentar:

* Nome do produto;
* Código;
* Fotografia, quando disponível.

A quantidade disponível em estoque não deverá aparecer diretamente nos resultados da busca da tela de vendas, ficando disponível na tela específica de consulta de estoque.

Além da busca textual, o sistema deverá oferecer busca por voz como recurso complementar.

⸻

3. REALIZAÇÃO DE VENDAS

3.1. Tela principal de vendas

A tela principal deverá concentrar os recursos necessários para realizar uma venda de maneira rápida.

A interface deverá combinar:

* Campo de busca em destaque;
* Opção de busca por voz;
* Grade ou lista de produtos;
* Lista de itens adicionados ao carrinho;
* Quantidades dos produtos;
* Valores individuais;
* Total da venda.

O vendedor poderá adicionar diversos produtos ao carrinho, alterar suas quantidades e acompanhar o valor total da operação.

O preço utilizado inicialmente será aquele cadastrado para o produto. Entretanto, o vendedor poderá aplicar descontos durante a venda.

3.2. Aplicação de descontos

O sistema deverá permitir a aplicação de descontos em reais ou em percentual.

O desconto será aplicado ao item correspondente, permitindo que diferentes produtos de uma mesma venda tenham condições distintas.

Quando houver desconto, a interface deverá apresentar o preço original e o preço final do produto.

Não foi definido um limite máximo de desconto. Portanto, essa regra deverá permanecer flexível para uma definição futura.

3.3. Controle de estoque durante a venda

O sistema deverá verificar a disponibilidade dos produtos antes de permitir a finalização da venda.

Caso o vendedor tente adicionar ou vender uma quantidade superior ao estoque disponível, deverá ser apresentado um alerta destacado, informando a quantidade atualmente disponível.

O sistema não deverá permitir a finalização de uma venda com quantidade superior ao saldo de estoque.

O vendedor deverá poder ajustar a quantidade diretamente no carrinho.

Após a confirmação da venda, o sistema deverá registrar a operação e realizar automaticamente a baixa das quantidades correspondentes no estoque.

⸻

4. BUSCA POR VOZ

A busca por voz será um recurso importante para agilizar o atendimento, especialmente em lojas que possuem produtos com nomes técnicos, medidas e especificações.

O vendedor deverá tocar no ícone de microfone e falar o nome ou as características do produto desejado.

Exemplos:

* “Metalon 30 por 20”;
* “Chapa 20”;
* “Tubo de PVC de 100 milímetros”.

O sistema deverá interpretar o áudio, pesquisar os produtos correspondentes no catálogo e apresentar os resultados relacionados para confirmação do vendedor.

O produto não deverá ser adicionado automaticamente ao carrinho apenas com o reconhecimento da fala. O vendedor deverá confirmar qual produto deseja selecionar.

4.1. Correção de reconhecimento

Caso o reconhecimento esteja incorreto, o vendedor poderá corrigir a pesquisa digitando o nome do produto ou iniciar uma nova busca por voz.

A cada novo acionamento do microfone, a pesquisa anterior deverá ser apagada ou substituída, iniciando uma nova busca.

Por exemplo, se o vendedor pesquisar por “chapa”, o sistema deverá apresentar os produtos relacionados a chapa, sem manter os resultados da pesquisa anterior.

4.2. Reconhecimento de quantidades

O sistema deverá considerar a quantidade mencionada pelo vendedor durante a busca por voz.

Caso o vendedor informe uma quantidade, ela deverá ser reconhecida e considerada na seleção do produto.

Caso nenhuma quantidade seja mencionada, o produto deverá aparecer sem uma quantidade reconhecida, permitindo que o vendedor ajuste manualmente no carrinho.

A precisão do reconhecimento de termos técnicos, medidas e variações de nomes dependerá da qualidade do catálogo e do tratamento das expressões utilizadas. Por isso, a seleção final deverá sempre ser confirmada pelo vendedor.

⸻

5. FINALIZAÇÃO E PAGAMENTO

A finalização da venda deverá apresentar o valor total de maneira destacada e permitir a seleção da forma de pagamento.

As formas de pagamento inicialmente previstas são:

* Pix;
* Dinheiro;
* Cartão de crédito;
* Cartão de débito.

O processo deverá ser simples, consistindo na seleção da modalidade de pagamento e na confirmação da operação.

Não foi solicitada integração inicial com adquirentes, maquininhas ou sistemas externos de processamento de pagamentos. O registro da modalidade escolhida será realizado diretamente no PDV.

Após a confirmação, a venda deverá ser registrada no histórico e o estoque atualizado automaticamente.

⸻

6. CADASTRO DE CLIENTES

O sistema deverá permitir o cadastro de clientes com os seguintes dados:

* Nome;
* Telefone.

O cadastro deverá ser simples e rápido, evitando exigir informações desnecessárias durante o atendimento.

O vendedor poderá cadastrar um cliente diretamente durante a realização de uma venda ou utilizar uma tela própria de cadastro.

A associação de um cliente à venda será opcional. Portanto, o sistema deverá permitir a finalização de vendas sem identificação de cliente.

⸻

7. CONTROLE DE ESTOQUE

7.1. Consulta de estoque

O sistema deverá possuir uma tela específica para consulta de estoque, separada da tela de vendas.

Essa tela terá finalidade de consulta, não permitindo registrar entradas de mercadorias nem alterar diretamente as quantidades disponíveis.

A consulta deverá permitir localizar produtos pelo nome ou código e apresentar:

* Nome do produto;
* Código;
* Quantidade disponível;
* Indicador de estoque baixo;
* Indicador de produto sem estoque.

Os produtos com estoque baixo ou zerado deverão receber algum tipo de destaque visual para facilitar a identificação.

O critério exato utilizado para determinar estoque baixo ainda será definido.

7.2. Totalizadores de estoque

A tela de estoque deverá apresentar indicadores gerais que permitam compreender a situação do estoque da loja.

Os totalizadores definidos são:

1. Total de produtos cadastrados: quantidade de produtos distintos registrados no sistema.
2. Quantidade total de unidades em estoque: soma das quantidades disponíveis de todos os produtos.
3. Valor total do estoque a preço de custo: soma dos valores de custo dos produtos multiplicados pelas respectivas quantidades disponíveis.
4. Valor potencial de venda: soma dos preços de venda multiplicados pelas respectivas quantidades disponíveis.
5. Produtos sem estoque: quantidade de produtos cadastrados que possuem saldo igual a zero.
6. Produtos com estoque baixo: quantidade de produtos que se encontram abaixo do critério de estoque baixo definido futuramente.

Os valores deverão ser calculados com base nos dados atualizados do estoque.

7.3. Exportação de estoque

O sistema deverá permitir exportar os dados do estoque para uma planilha, preferencialmente em formato compatível com Excel.

A exportação deverá facilitar consultas externas, conferências e análises dos produtos cadastrados e de suas quantidades.

⸻

8. ENTRADA DE MERCADORIAS

A entrada de mercadorias deverá possuir uma tela própria, separada da consulta de estoque.

Essa funcionalidade será responsável por registrar o recebimento de produtos novos e a reposição de produtos já cadastrados.

8.1. Entrada de produtos existentes

Quando o produto já estiver cadastrado, o usuário deverá:

1. Localizar o produto pelo nome ou código.
2. Informar a quantidade recebida.
3. Registrar a entrada.
4. Permitir a atualização do preço de custo.
5. Permitir a atualização do preço de venda, caso necessário.

A quantidade recebida deverá ser somada automaticamente ao estoque atual, sem substituir o saldo existente.

8.2. Entrada de produtos novos

Quando o produto ainda não estiver cadastrado, o sistema deverá permitir realizar o cadastro e registrar sua entrada no mesmo fluxo.

O usuário deverá informar os dados do produto, seus preços e a quantidade recebida.

Após a confirmação, o produto deverá ser cadastrado e sua quantidade inicial registrada no estoque.

8.3. Histórico de entradas

Todas as entradas de mercadorias deverão gerar registros históricos, contendo:

* Data da entrada;
* Produto;
* Quantidade recebida;
* Preço de custo praticado;
* Preço de venda registrado ou atualizado;
* Fornecedor.

Foi definido que o fornecedor deverá ser registrado em cada entrada de mercadoria.

A estrutura completa do cadastro de fornecedores e a necessidade de uma tela específica para gerenciamento desses cadastros ainda serão definidas.

⸻

9. HISTÓRICO DE VENDAS

O sistema deverá possuir uma tela de histórico de vendas, permitindo consultar as operações realizadas anteriormente.

Cada registro deverá apresentar informações suficientes para identificar e compreender a venda.

Os dados previstos são:

* Identificador da venda;
* Data;
* Hora;
* Produtos vendidos;
* Quantidades;
* Vendedor responsável;
* Cliente, quando informado;
* Preços dos produtos;
* Descontos aplicados;
* Valor total;
* Forma de pagamento.

O histórico deverá permitir consultar os detalhes de cada venda e realizar seu cancelamento.

9.1. Cancelamento de vendas

O sistema deverá permitir cancelar uma venda já finalizada.

Para realizar o cancelamento, deverá ser obrigatório informar o motivo.

Após a confirmação, o sistema deverá devolver automaticamente ao estoque as quantidades correspondentes aos produtos daquela venda.

O cancelamento deverá ser registrado no histórico, preservando as informações da operação original e identificando que ela foi cancelada.

9.2. Correção de vendas

Uma venda finalizada não poderá ser editada diretamente.

Caso seja identificada alguma informação incorreta, o procedimento será cancelar a venda original e realizar uma nova venda com os dados corrigidos.

Dessa forma, o sistema manterá o histórico das operações, permitindo identificar tanto a venda original quanto seu cancelamento e a eventual venda refeita.

⸻

10. RELATÓRIO DIÁRIO E CONTROLE DE CAIXA

A primeira versão deverá contar com um relatório diário integrado ao controle de caixa.

A proposta é concentrar as principais informações da operação em uma única área, evitando inicialmente a criação de diversos relatórios separados.

10.1. Informações do relatório diário

O relatório deverá apresentar:

* Data de referência;
* Quantidade de vendas realizadas;
* Produtos vendidos e respectivas quantidades;
* Valor bruto das vendas;
* Total de descontos concedidos;
* Valor líquido das vendas;
* Vendas canceladas;
* Motivos dos cancelamentos;
* Totais por forma de pagamento;
* Identificação dos vendedores responsáveis.

O relatório deverá considerar os cancelamentos para que os valores apresentados representem corretamente as operações realizadas no período.

10.2. Abertura de caixa

O sistema deverá permitir registrar a abertura do caixa.

No momento da abertura, o responsável deverá informar o valor inicial disponível para troco.

Esse valor será utilizado como referência para o controle financeiro do caixa durante o período.

10.3. Fechamento de caixa

No fechamento, o responsável deverá informar o valor efetivamente contado no caixa.

O sistema deverá comparar o valor informado com o valor esperado, considerando o saldo inicial e as movimentações registradas em dinheiro.

Caso exista alguma diferença, o sistema deverá apresentar o valor correspondente para conferência.

O fechamento não deverá ser obrigatório para todos os usuários em todas as situações. A pessoa responsável poderá optar por realizar o fechamento e consultar o resumo final.

As regras de permissão para abertura e fechamento do caixa serão definidas posteriormente.

10.4. Exportação de relatórios

O relatório diário deverá permitir exportação para Excel, facilitando o armazenamento, a conferência e a análise das informações.

Relatórios adicionais poderão ser avaliados em versões futuras, como:

* Vendas por período;
* Produtos mais vendidos;
* Descontos concedidos;
* Desempenho por vendedor.

Esses relatórios não fazem parte da definição inicial obrigatória.

⸻

11. ESTRUTURA GERAL DAS TELAS

As telas previstas para a primeira versão do aplicativo são:

1. Login: acesso dos usuários ao sistema.
2. Tela principal de vendas: busca textual e por voz, apresentação dos produtos e acesso ao carrinho.
3. Carrinho e confirmação de pagamento: gerenciamento dos itens, quantidades, descontos e finalização da venda.
4. Cadastro rápido de clientes: inclusão de clientes durante o atendimento.
5. Tela de clientes: cadastro e consulta de clientes.
6. Cadastro de produtos: inclusão e gerenciamento das informações dos produtos.
7. Entrada de mercadorias: registro de produtos novos e reposições.
8. Consulta de estoque: visualização das quantidades e totalizadores.
9. Histórico de vendas: consulta de operações e cancelamentos.
10. Relatório diário e controle de caixa: acompanhamento das vendas e movimentações financeiras.

O detalhamento visual e funcional de cada tela será realizado posteriormente.

Neste momento, a definição permanece em nível macro, priorizando as funcionalidades e responsabilidades de cada área, sem estabelecer prematuramente todos os detalhes de layout e navegação.

⸻

12. REGRAS GERAIS DE FUNCIONAMENTO

As seguintes regras deverão orientar o desenvolvimento do sistema:

* Todos os dispositivos deverão utilizar uma base de dados centralizada.
* O login será obrigatório para acessar o aplicativo.
* Inicialmente, todos os usuários terão as mesmas permissões.
* O código de cada produto deverá ser único.
* O nome e o código serão os únicos campos obrigatórios no cadastro de produtos.
* O preço de custo não deverá ser exibido na tela de vendas.
* O controle de estoque utilizará unidades inteiras.
* A tela de consulta de estoque não permitirá alterações diretas no saldo.
* As entradas de mercadorias serão registradas em uma funcionalidade específica.
* A venda deverá validar a disponibilidade do estoque.
* Não será permitido finalizar uma venda com quantidade superior ao estoque disponível.
* A confirmação de uma venda deverá gerar a baixa automática no estoque.
* A aplicação de descontos deverá ocorrer por item.
* A busca por voz deverá apresentar resultados para confirmação, sem adicionar produtos automaticamente.
* O cadastro e a associação de clientes serão opcionais durante a venda.
* O cancelamento deverá exigir um motivo.
* O cancelamento deverá devolver automaticamente os produtos ao estoque.
* Uma venda finalizada não poderá ser editada; deverá ser cancelada e refeita quando necessário.
* As operações realizadas offline deverão ser sincronizadas posteriormente.
* O Excel será utilizado para exportação e análise, não como banco de dados operacional.

⸻

13. PONTOS PENDENTES DE DEFINIÇÃO

Os itens abaixo ainda precisam ser discutidos e definidos antes ou durante as próximas etapas do desenvolvimento.

13.1. Funcionamento offline

* Quais operações poderão funcionar integralmente sem internet?
* Como será tratado o conflito quando dois dispositivos tentarem vender simultaneamente o mesmo produto?
* Como serão apresentadas as operações que aguardam sincronização?
* Como o sistema deverá agir quando uma operação offline não puder ser validada posteriormente?

13.2. Autenticação e segurança

* Como será realizada a recuperação de senha?
* Quais serão as regras de segurança das sessões?
* Como será tratado o acesso em dispositivos diferentes?
* Será necessário encerrar sessões remotamente?

13.3. Estoque

* Qual será o critério para identificar um produto com estoque baixo?
* O estoque mínimo será definido individualmente para cada produto?
* Como serão tratadas eventuais perdas, avarias ou ajustes de inventário?
* Será necessário manter um histórico de todas as movimentações de estoque?

13.4. Fornecedores

* Quais informações deverão compor o cadastro de fornecedores?
* Será necessária uma tela própria para cadastro e consulta de fornecedores?
* Como será realizado o vínculo entre fornecedor e entrada de mercadoria?

13.5. Devoluções e trocas

* Como serão tratadas devoluções parciais?
* Como serão registradas trocas de produtos?
* Será permitido cancelar parcialmente uma venda?
* Como essas operações afetarão o estoque e o caixa?

13.6. Controle de caixa

* Serão permitidas retiradas de dinheiro?
* Será possível registrar reforços de caixa?
* Como serão registradas despesas e outras movimentações?
* Quem poderá abrir e fechar o caixa?
* O sistema deverá permitir mais de um caixa aberto simultaneamente?

13.7. Permissões de usuários

* Será necessário criar perfis diferentes de acesso?
* Quais usuários poderão cancelar vendas?
* Quais usuários poderão alterar preços?
* Quais usuários poderão realizar abertura e fechamento de caixa?

13.8. Infraestrutura e implantação

* Qual será a estratégia definitiva de backup?
* Como será realizado o processo de recuperação de dados?
* Quais serão os procedimentos de testes antes da implantação?
* Como será realizada a publicação e distribuição das atualizações do aplicativo?
* Como será organizada a manutenção do sistema?

13.9. Interface e experiência de uso

* Qual será a organização visual definitiva das telas?
* Como será a navegação entre as funcionalidades?
* Quais informações deverão receber maior destaque?
* Como serão apresentados os alertas, confirmações e mensagens de erro?

⸻

14. DIRETRIZES PARA O DESENVOLVIMENTO

O desenvolvimento deverá priorizar a simplicidade, a confiabilidade e a facilidade de utilização.

A interface deverá evitar excesso de informações e etapas desnecessárias, principalmente durante a realização das vendas.

As funcionalidades deverão ser organizadas de maneira que o vendedor consiga executar as operações mais comuns com poucos toques.

A arquitetura deverá permitir a expansão do sistema para outros segmentos comerciais, evitando dependência de regras específicas de uma loja de ferragens.

O controle de estoque, o registro de vendas e a sincronização entre dispositivos deverão receber atenção especial, pois são partes essenciais para a integridade das informações.

O desenvolvimento deverá ocorrer de forma gradual, começando pelas funcionalidades fundamentais e avançando conforme os requisitos forem detalhados e validados.

⸻

15. ESCOPO CONSOLIDADO

Com base nas decisões tomadas até 23 de novembro de 2026, o escopo inicial do sistema contempla:

* Aplicativo mobile para Android;
* Desenvolvimento com React Native e Expo;
* Banco de dados centralizado utilizando Supabase e PostgreSQL;
* Login e acesso de múltiplos vendedores;
* Cadastro e gerenciamento de produtos;
* Busca textual e por voz;
* Carrinho com múltiplos produtos;
* Alteração de quantidades e aplicação de descontos;
* Validação e baixa automática de estoque;
* Registro de pagamentos por modalidade;
* Cadastro e associação opcional de clientes;
* Consulta de estoque e indicadores;
* Entrada de mercadorias e registro de fornecedores;
* Histórico de vendas;
* Cancelamento com justificativa e retorno ao estoque;
* Relatório diário;
* Abertura e fechamento de caixa;
* Exportação de dados e relatórios para Excel;
* Funcionamento online e offline, com sincronização automática das operações previstas.

Funcionalidades adicionais, regras específicas e detalhamento de interface serão definidos nas próximas etapas.

⸻

FIM DO DOCUMENTO

Versão 2.0 — Requisitos consolidados em 23/11/2026