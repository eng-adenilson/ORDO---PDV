"""Telas faltantes + resultados de fluxo do ORDO.
Funções `ov_*` devolvem só a camada de sobreposição (para clonar a tela base no Figma).
"""
from ds import *

SCRIM = '<rect x="0" y="0" width="360" height="800" fill="#000000" fill-opacity="0.45"/>'


def ovsvg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{body}</svg>'


def sheet(top, title, sub=None):
    b = SCRIM + r(0, top, W, H - top, C["card"], 24) + r(156, top + 12, 48, 4, C["line"], 2)
    b += t(20, top + 50, title, 18, 700) + icon("x", 316, top + 30)
    if sub:
        b += t(20, top + 72, sub, 13, 400, C["muted"])
    return b


def toast(y, text, kind="ok"):
    bg = {"ok": C["ink"], "warn": C["warn"]}[kind]
    ic = "check" if kind == "ok" else "alert"
    return r(16, y, 328, 52, bg, 14) + r(28, y + 12, 28, 28, C["brand"] if kind == "ok" else "#FFFFFF", 14) + \
        icon(ic, 32, y + 16, C["ink"] if kind == "ok" else C["warn"], 20) + t(68, y + 31, text, 13, 600, "#FFFFFF")


def result(title, lines, rows, primary, secondary=None, tone="ok", ic="check", note=None):
    bg, fg = {"ok": (C["okSoft"], C["ok"]), "warn": (C["warnSoft"], C["warn"]),
              "danger": (C["dangerSoft"], C["danger"]), "brand": (C["brandSoft"], C["ink"])}[tone]
    b = statusbar() + r(124, 120, 112, 112, bg, 56) + icon(ic, 148, 144, fg, 64)
    b += t(180, 280, title, 22, 800, anchor="middle")
    for i, ln in enumerate(lines):
        b += t(180, 308 + i * 20, ln, 14, 400, C["muted"], "middle")
    y = 308 + len(lines) * 20 + 20
    if rows:
        b += card(16, y, 328, 24 + len(rows) * 30)
        for i, (k, v, *c) in enumerate(rows):
            b += t(30, y + 34 + i * 30, k, 13, 500, C["muted"]) + t(330, y + 34 + i * 30, v, 13, 700, c[0] if c else C["ink"], "end")
        y += 24 + len(rows) * 30 + 16
    if note:
        b += r(16, y, 328, 52, C["warnSoft"], 12) + icon("cloud", 28, y + 14, C["warn"]) + t(60, y + 31, note, 12, 600, C["warn"])
    if secondary:
        b += button(16, 652, 328, secondary, "ghost", 52)
    b += button(16, 716, 328, primary, "primary", 56)
    return screen(title, b)


# ---------------- 1. Desconto (sheet sobre carrinho) ----------------
def ov_desconto():
    b = sheet(300, "Desconto no item", "Metalon 30x20 #18 6m · 2 un")
    s1, _ = chip(20, 396, "Em R$", False, 156)
    s2, _ = chip(184, 396, "Em %", True, 156)
    b += s1 + s2
    b += field(20, 448, 320, "Percentual de desconto", "10 %")
    b += card(20, 540, 320, 84)
    b += t(34, 566, "Preço original", 13, 500, C["muted"]) + t(326, 566, money(89.90), 13, 600, C["muted"], "end") + r(268, 561, 58, 1, C["muted"])
    b += t(34, 590, "Preço final (un)", 13, 500, C["muted"]) + t(326, 590, money(80.91), 15, 800, C["ok"], "end")
    b += t(34, 612, "Economia no item", 12, 500, C["muted"]) + t(326, 612, "- " + money(17.98), 12, 700, C["ok"], "end")
    b += button(20, 650, 152, "Remover", "ghost", 52) + button(184, 650, 156, "Aplicar", "primary", 52)
    return ovsvg(b)


# ---------------- 2. Entrada — produto novo ----------------
def entrada_novo():
    b = appbar("Entrada de mercadorias")
    s1, _ = chip(16, 116, "Produto existente", False, 160)
    s2, _ = chip(184, 116, "Produto novo", True, 160)
    b += s1 + s2
    b += field(16, 160, 328, "Nome", "Parafuso sextavado 1/4\" x 2\"", req=True)
    b += field(16, 242, 200, "Código", "PSX14-2", req=True, suffix="barcode") + field(228, 242, 116, "Categoria", "Fixação")
    b += field(16, 324, 158, "Preço de custo", "R$ 0,22") + field(186, 324, 158, "Preço de venda", "R$ 0,45")
    b += field(16, 406, 158, "Qtd recebida", "500", req=True) + field(186, 406, 158, "Estoque inicial", "500")
    b += field(16, 488, 328, "Fornecedor", "Fixar Parafusos Ltda", req=True, ic="truck", suffix="chev")
    b += r(16, 584, 328, 56, C["bg"], 12, C["line"]) + icon("camera", 30, 600, C["muted"])
    b += t(64, 617, "Adicionar foto (opcional)", 14, 600, C["ink2"])
    b += t(16, 668, "Cadastra o produto e registra a entrada juntos.", 12, 500, C["muted"])
    b += button(16, 716, 328, "Cadastrar e registrar entrada", "primary", 56)
    return screen("Entrada — produto novo", b)


# ---------------- 3. Produtos (gerenciamento) ----------------
def produtos():
    b = appbar("Produtos", action="plus", sub="312 cadastrados · 4 inativos")
    b += r(16, 116, 328, 48, C["card"], 12, C["line"]) + icon("search", 30, 128, C["muted"])
    b += t(64, 145, "Nome ou código…", 15, 400, C["muted"]) + icon("barcode", 306, 128)
    x = 16
    for i, lb in enumerate(["Ativos", "Inativos", "Metalon", "Chapas"]):
        s, w = chip(x, 174, lb, i == 0)
        b += s
        x += w + 8
    rows = [("Metalon 30x20 #18 6m", "MET3020 · Metalon", 89.90, "ativo"), ("Chapa galvanizada nº 20", "CHG20 · Chapas", 145.00, "ativo"),
            ("Tubo PVC 100mm 6m", "PVC100 · Hidráulica", 79.50, "ativo"), ("Cimento CP-II 50kg", "CIM50 · Básicos", 38.90, "ativo"),
            ("Parafuso sextavado 1/4\"", "PSX14-2 · Fixação", 0.45, "ativo"), ("Torneira plástica 1/2\"", "TRN12 · Hidráulica", 9.90, "inativo")]
    for i, (n, c, p, st) in enumerate(rows):
        y = 222 + i * 80
        b += card(16, y, 328, 72) + thumb(28, y + 12) + t(88, y + 30, n, 14, 600) + t(88, y + 50, c, 12, 500, C["muted"])
        b += t(330, y + 50, money(p), 14, 700, anchor="end")
        if st == "inativo":
            s, w = badge(330 - 54, y + 12, "Inativo", "neutral")
            b += s
    b += tabbar("Mais")
    return screen("Produtos", b)


# ---------------- 4. Relatório completo ----------------
def relatorio():
    b = appbar("Relatório do dia", action="download", sub="Terça, 24/11 · considera cancelamentos")
    b += t(16, 136, "Produtos vendidos", 15, 700)
    prods = [("Metalon 30x20 #18 6m", 14), ("Chapa galvanizada nº 20", 9), ("Cimento CP-II 50kg", 22), ("Disco de corte 7\"", 31)]
    for i, (n, q) in enumerate(prods):
        y = 148 + i * 40
        b += t(16, y + 24, n, 14, 500) + t(344, y + 24, f"{q} un", 14, 700, anchor="end") + r(16, y + 38, 328, 1, C["line"])
    b += t(280, 330, "Ver todos (38)", 13, 700, anchor="end")
    b += t(16, 366, "Cancelamentos", 15, 700)
    for i, (idv, mot, v) in enumerate([("#1046", "Cliente desistiu da compra", 1240.00), ("#1039", "Lançado em duplicidade", 89.90)]):
        y = 378 + i * 64
        b += card(16, y, 328, 56) + t(30, y + 24, f"Venda {idv}", 14, 700) + t(30, y + 44, mot, 12, 500, C["muted"])
        b += t(330, y + 34, money(v), 14, 700, C["danger"], "end")
    b += t(16, 534, "Por vendedor", 15, 700)
    for i, (n, q, v) in enumerate([("Carla", 15, 2104.10), ("João", 12, 1738.60)]):
        y = 546 + i * 64
        b += card(16, y, 328, 56) + r(28, y + 10, 36, 36, C["brandSoft"], 18) + t(46, y + 34, n[0], 15, 800, anchor="middle")
        b += t(76, y + 26, n, 14, 700) + t(76, y + 44, f"{q} vendas", 12, 500, C["muted"]) + t(330, y + 34, money(v), 14, 700, anchor="end")
    b += button(16, 716, 328, "Exportar Excel", "primary", 56, ic="download")
    return screen("Relatório do dia", b)


# ---------------- 5. Fechar caixa ----------------
def fechar_caixa():
    b = appbar("Fechar caixa", sub="Aberto às 08:02 por Carla")
    b += card(16, 116, 328, 128)
    for i, (k, v) in enumerate([("Troco inicial", money(150.00)), ("Vendas em dinheiro", "+ " + money(812.40))]):
        b += t(30, 146 + i * 28, k, 14, 500, C["muted"]) + t(330, 146 + i * 28, v, 14, 600, anchor="end")
    b += r(30, 194, 300, 1, C["line"]) + t(30, 224, "Esperado na gaveta", 15, 700) + t(330, 224, money(962.40), 18, 800, anchor="end")
    b += field(16, 260, 328, "Quanto você contou na gaveta?", "R$ 952,40", req=True, ic="cash")
    b += t(16, 362, "Conte as notas e moedas antes de digitar.", 12, 500, C["muted"])
    b += r(16, 384, 328, 88, C["dangerSoft"], 14, C["danger"])
    b += icon("alert", 30, 400, C["danger"]) + t(62, 418, "Falta R$ 10,00 no caixa", 15, 800, C["danger"])
    b += t(62, 440, "Confira de novo ou registre assim mesmo.", 12, 500, C["danger"])
    b += t(62, 458, "A diferença fica no relatório do dia.", 12, 500, C["danger"])
    b += field(16, 488, 328, "Observação (opcional)", "", ph="Ex.: troco dado a mais na venda #1031")
    b += button(16, 652, 328, "Contar de novo", "ghost", 52) + button(16, 716, 328, "Confirmar fechamento", "primary", 56)
    return screen("Fechar caixa", b)


# ---------------- 6-7. Voz: ouvindo, sem quantidade, não entendi ----------------
def ov_voz_ouvindo():
    b = sheet(420, "Ouvindo…")
    b += r(130, 480, 100, 100, C["brandSoft"], 50) + r(150, 500, 60, 60, C["brand"], 30) + icon("mic", 168, 518, C["ink"])
    for i, h in enumerate([16, 28, 40, 24, 36, 20, 30]):
        b += r(126 + i * 16, 620 - h / 2, 8, h, C["ink"], 4)
    b += t(180, 668, "Fale o nome e a medida. Ex.: “chapa 20”", 13, 500, C["muted"], "middle")
    b += button(20, 700, 320, "Cancelar", "ghost", 52)
    return ovsvg(b)


def ov_voz_semqtd():
    b = sheet(300, "Busca por voz")
    b += r(20, 366, 320, 64, C["brandSoft"], 14) + r(32, 378, 40, 40, C["brand"], 20) + icon("mic", 40, 386)
    b += t(84, 394, "Você disse:", 12, 500, C["muted"]) + t(84, 414, "“chapa 20”", 16, 700)
    b += t(20, 458, "Nenhuma quantidade falada · entra com 1", 13, 600, C["ink2"])
    rows = [("Chapa galvanizada nº 20", "CHG20 · R$ 145,00", True), ("Chapa lisa nº 20 1x2m", "CHL20 · R$ 132,00", False),
            ("Chapa xadrez nº 20", "CHX20 · R$ 189,00", False)]
    for i, (n, c, sel) in enumerate(rows):
        y = 470 + i * 72
        b += r(20, y, 320, 64, C["card"], 12, C["ink"] if sel else C["line"], 2 if sel else 1)
        b += thumb(30, y + 8) + t(90, y + 28, n, 14, 600) + t(90, y + 48, c, 12, 500, C["muted"])
    b += button(20, 700, 152, "Falar de novo", "ghost", ic="mic") + button(184, 700, 156, "Adicionar", "primary")
    return ovsvg(b)


def ov_voz_erro():
    b = sheet(420, "Não entendi")
    b += r(140, 474, 80, 80, C["warnSoft"], 40) + icon("mic", 160, 494, C["warn"], 40)
    b += t(180, 590, "Não reconheci nenhum produto.", 15, 700, anchor="middle")
    b += t(180, 612, "Fale mais perto do celular ou digite o nome.", 13, 500, C["muted"], "middle")
    b += button(20, 700, 152, "Digitar", "ghost") + button(184, 700, 156, "Falar de novo", "primary", ic="mic")
    return ovsvg(b)


# ---------------- 8. Busca digitando / sem resultado (sobre Vendas) ----------------
def _busca_head(q):
    b = r(0, 0, W, 728, C["bg"]) + r(0, 0, W, 176, C["card"]) + statusbar() + icon("back", 16, 62) + t(56, 80, "Buscar produto", 20, 700)
    b += r(20, 96, 320, 56, C["card"], 12, C["ink"], 2) + icon("search", 34, 112) + t(68, 129, q, 15, 500)
    b += icon("x", 252, 112, C["muted"]) + r(284, 100, 48, 48, C["brand"], 10) + icon("mic", 296, 112)
    return b + r(0, 175, W, 1, C["line"])


def ov_busca():
    b = _busca_head("tubo pvc|")
    b += t(20, 204, "6 resultados", 13, 600, C["muted"])
    rows = [("Tubo PVC 100mm 6m", "PVC100", 79.50), ("Tubo PVC 75mm 6m", "PVC75", 58.90), ("Tubo PVC 50mm 6m", "PVC50", 39.90),
            ("Tubo PVC 40mm 6m", "PVC40", 29.90), ("Tubo PVC soldável 25mm", "PVS25", 18.50), ("Tubo PVC soldável 20mm", "PVS20", 14.90)]
    for i, (n, c, p) in enumerate(rows):
        y = 216 + i * 72
        b += card(16, y, 328, 64) + thumb(26, y + 8) + t(86, y + 28, n, 14, 600) + t(86, y + 48, c + " · ", 12, 500, C["muted"])
        b += t(86 + len(c) * 7.4 + 14, y + 48, money(p), 12, 700) + r(288, y + 10, 44, 44, C["ink"], 10) + icon("plus", 298, y + 20, "#FFFFFF")
    return ovsvg(b)


def ov_busca_vazia():
    b = _busca_head("metalon 50x80|")
    b += r(130, 260, 100, 100, "#ECEAE3", 50) + icon("search", 156, 286, C["muted"], 48)
    b += t(180, 400, "Nada encontrado para", 16, 700, anchor="middle") + t(180, 422, "“metalon 50x80”", 16, 700, anchor="middle")
    b += t(180, 452, "Confira a medida ou busque só “metalon”.", 13, 500, C["muted"], "middle")
    s, _ = chip(122, 476, "Buscar “metalon”", False, 116)
    b += s
    return ovsvg(b)


# ---------------- 9. Scanner ----------------
def scanner():
    b = r(0, 0, W, H, "#111111") + statusbar(True)
    b += icon("x", 16, 56, "#FFFFFF") + t(180, 74, "Ler código de barras", 17, 700, "#FFFFFF", "middle")
    b += r(40, 230, 280, 180, "none", 16, "#FFFFFF", 3) + r(56, 318, 248, 2, C["brand"])
    b += t(180, 450, "Aponte para o código do produto", 15, 600, "#FFFFFF", "middle")
    b += t(180, 472, "A leitura é automática", 13, 400, "#BDBBB3", "middle")
    b += r(16, 640, 328, 56, "#2A2A2A", 14) + t(180, 674, "Digitar código", 15, 600, "#FFFFFF", "middle")
    return screen("Scanner", b, "#111111")


# ---------------- 10. Sincronização ----------------
def sincronizacao():
    b = appbar("Sincronização", sub="Sem internet desde 15:20")
    b += r(16, 116, 328, 72, C["warnSoft"], 14) + icon("cloud", 30, 140, C["warn"])
    b += t(64, 146, "2 vendas guardadas neste celular", 14, 700, C["warn"])
    b += t(64, 168, "Envio automático quando a internet voltar", 12, 500, C["warn"])
    b += t(16, 222, "Aguardando envio", 15, 700)
    for i, (idv, h, v) in enumerate([("#1045", "15:31", 38.90), ("#1049", "16:58", 212.00)]):
        y = 234 + i * 68
        b += card(16, y, 328, 60) + t(30, y + 26, f"Venda {idv}", 14, 700) + t(30, y + 46, f"{h} · João", 12, 500, C["muted"])
        b += t(330, y + 36, money(v), 14, 700, anchor="end")
    b += t(16, 396, "Precisa de atenção", 15, 700)
    b += r(16, 408, 328, 140, C["card"], 14, C["danger"], 1.5)
    b += t(30, 434, "Venda #1044 · 14:02", 14, 700) + t(30, 456, "Não foi enviada: Cimento CP-II 50kg ficou", 12, 500, C["danger"])
    b += t(30, 474, "sem estoque em outro aparelho.", 12, 500, C["danger"])
    b += button(30, 490, 140, "Ver venda", "ghost", 44) + button(180, 490, 150, "Tentar de novo", "primary", 44)
    b += t(16, 582, "Enviado hoje", 15, 700) + t(16, 606, "24 vendas · 3 entradas · última às 15:19", 13, 500, C["muted"])
    b += button(16, 716, 328, "Tentar enviar agora", "primary", 56)
    return screen("Sincronização", b)


# ---------------- 11. Venda cancelada (detalhe pós-cancelamento) ----------------
def venda_cancelada():
    b = appbar("Venda #1048", sub="24/11/2026 · 16:42")
    b += toast(116, "Cancelada · 5 itens de volta ao estoque")
    b += r(16, 180, 328, 92, C["dangerSoft"], 14)
    b += t(30, 206, "CANCELADA às 17:05 por João", 12, 800, C["danger"], ls=0.5)
    b += t(30, 230, "Motivo", 12, 500, C["muted"]) + t(30, 254, "Cliente pagou com outro cartão; venda refeita.", 13, 600)
    b += card(16, 288, 328, 96)
    for i, (k_, v_) in enumerate([("Vendedor", "João"), ("Cliente", "Marcos Pereira"), ("Pagamento", "Pix")]):
        b += t(30, 314 + i * 24, k_, 13, 500, C["muted"]) + t(330, 314 + i * 24, v_, 13, 600, anchor="end")
    b += t(16, 412, "Itens", 15, 700)
    for i, (n, q, v_) in enumerate([("Metalon 30x20 #18 6m", "2 × R$ 80,91 · -10%", 161.82), ("Chapa galvanizada nº 20", "2 × R$ 145,00", 290.00),
                                     ("Fita veda-rosca 18mm", "1 × R$ 4,50", 4.50)]):
        y = 424 + i * 60
        b += card(16, y, 328, 52) + t(30, y + 22, n, 14, 600, C["muted"]) + t(30, y + 40, q, 12, 500, C["muted"])
        b += t(330, y + 32, money(v_), 14, 700, C["muted"], "end")
    b += t(30, 628, "Total", 16, 700, C["muted"]) + t(330, 628, money(456.32), 18, 800, C["muted"], "end") + r(236, 622, 94, 1, C["muted"])
    b += button(16, 716, 328, "Refazer venda com estes itens", "primary", 56)
    return screen("Venda cancelada", b)


# ---------------- Resultados de fluxo ----------------
def login_erro():
    b = statusbar() + logo(140, 150, 80)
    b += t(180, 270, "ORDO", 32, 800, anchor="middle", ls=2)
    b += r(24, 306, 312, 52, C["dangerSoft"], 12) + icon("alert", 36, 320, C["danger"])
    b += t(68, 337, "Usuário ou senha incorretos.", 14, 700, C["danger"])
    b += field(24, 370, 312, "Usuário", "joao.balcao", ic="user")
    b += field(24, 460, 312, "Senha", "••••••", ic="lock", err="Confira a senha. Tentativa 2 de 5.")
    b += t(336, 578, "Esqueci a senha", 13, 600, C["ink"], "end")
    b += button(24, 600, 312, "Entrar", "primary")
    return screen("Login — erro", b)


def carrinho_vazio():
    b = appbar("Carrinho", sub="vazio")
    b += r(130, 220, 100, 100, "#ECEAE3", 50) + icon("cart", 156, 246, C["muted"], 48)
    b += t(180, 364, "Nenhum item no carrinho", 18, 700, anchor="middle")
    b += t(180, 390, "Busque ou fale o nome do produto", 14, 400, C["muted"], "middle")
    b += t(180, 410, "para começar a venda.", 14, 400, C["muted"], "middle")
    b += button(16, 652, 328, "Buscar por voz", "brand", 52, ic="mic") + button(16, 716, 328, "Voltar para produtos", "primary", 56)
    return screen("Carrinho vazio", b)


def venda_ok():
    return result("Venda concluída", ["Venda #1048 registrada e estoque", "atualizado."],
                  [("Total", money(456.32)), ("Pagamento", "Pix"), ("Cliente", "Marcos Pereira"), ("Itens", "5 un · 3 produtos")],
                  "Nova venda", "Ver detalhes da venda")


def venda_offline():
    return result("Venda salva", ["Sem internet agora. A venda #1049 ficou", "guardada neste celular."],
                  [("Total", money(212.00)), ("Pagamento", "Dinheiro")],
                  "Nova venda", "Ver sincronização", tone="warn", ic="cloud",
                  note="Estoque confirmado quando a internet voltar")


def entrada_ok():
    return result("Entrada registrada", ["20 unidades somadas ao estoque."],
                  [("Produto", "Chapa galv. nº 20"), ("Saldo", "3 → 23 un", C["ok"]), ("Custo", money(98.00)),
                   ("Fornecedor", "Aço Forte")],
                  "Registrar outra entrada", "Ver estoque")


def caixa_fechado():
    return result("Caixa fechado", ["Fechado às 18:07 por Carla."],
                  [("Vendas líquidas", money(3842.70)), ("Esperado em dinheiro", money(962.40)), ("Contado", money(952.40)),
                   ("Diferença", "- " + money(10.00), C["danger"])],
                  "Concluir", "Exportar relatório Excel", tone="brand", ic="lock")


def ov_produto_dup():
    b = r(16, 312, 328, 22, C["bg"]) + t(16, 328, "Código * · já usado por Tubo PVC 100mm 6m", 13, 700, C["danger"])
    b += r(16, 336, 328, 48, "#FFFFFF", 10, C["danger"], 1.5) + t(30, 365, "PVC100", 15)
    b += r(296, 338, 44, 44, C["bg"], 8) + icon("barcode", 306, 348)
    return ovsvg(b)


def ov_produto_salvo():
    return ovsvg(toast(628, "Produto salvo · Torneira plástica 1/2\""))


def ov_export():
    b = sheet(440, "Exportação pronta", "estoque_24-11-2026.xlsx · 312 produtos")
    apps = [("Compartilhar", "#3A3A3A"), ("Drive", "#3A3A3A"), ("E-mail", "#3A3A3A"), ("Salvar", "#1A1A1A")]
    for i, (n, c) in enumerate(apps):
        x = 32 + i * 80
        b += r(x, 540, 56, 56, c, 16) + icon("download", x + 16, 556, "#FFFFFF") + t(x + 28, 618, n, 12, 600, anchor="middle")
    b += button(20, 700, 320, "Fechar", "ghost", 52)
    return ovsvg(b)


FULL = [("12 Entrada — produto novo", entrada_novo), ("13 Produtos", produtos), ("14 Relatório do dia", relatorio),
        ("15 Fechar caixa", fechar_caixa), ("16 Scanner", scanner), ("17 Sincronização", sincronizacao),
        ("18 Venda cancelada", venda_cancelada), ("R1 Login — erro", login_erro), ("R2 Carrinho vazio", carrinho_vazio),
        ("R3 Venda concluída", venda_ok), ("R4 Venda salva offline", venda_offline), ("R5 Entrada registrada", entrada_ok),
        ("R6 Caixa fechado", caixa_fechado)]
OVER = [("03c Carrinho — desconto", "carrinho", ov_desconto), ("02c Voz — ouvindo", "vendas", ov_voz_ouvindo),
        ("02d Voz — sem quantidade", "vendas", ov_voz_semqtd), ("02e Voz — não entendi", "vendas", ov_voz_erro),
        ("02f Busca digitando", "vendas", ov_busca), ("02g Busca sem resultado", "vendas", ov_busca_vazia),
        ("R7 Produto — código duplicado", "produto", ov_produto_dup), ("R8 Produtos — produto salvo", "produtos", ov_produto_salvo),
        ("R9 Estoque — exportação pronta", "estoque", ov_export)]

if __name__ == "__main__":
    import os, re, subprocess, screens
    from PIL import Image
    os.makedirs("out2", exist_ok=True)
    base = {"carrinho": screens.carrinho(), "vendas": screens.vendas(), "produto": screens.produto(),
            "produtos": produtos(), "estoque": screens.estoque()}

    def mini(s):
        s = s.replace(' letter-spacing="0"', '').replace(' text-anchor="start"', '').replace(' rx="0"', '').replace(' font-weight="400"', '').replace(' scale(1.0)', '')
        s = re.sub(r'<text[^>]*></text>', '', s)
        s = re.sub(r'\b(x|y|width|height|cx|cy)="(-?\d+)\.0"', r'\1="\2"', s)
        s = re.sub(r'\b(x|y|width|height)="(-?\d+\.\d)\d+"', r'\1="\2"', s)
        s = re.sub(r'translate\((\d+)\.0 ', r'translate(\1 ', s)
        s = re.sub(r'scale\((\d+\.\d{4})\d*\)', r'scale(\1)', s)
        return s
    pngs = []
    for i, (n, f) in enumerate(FULL):
        s = f()
        open(f"out2/f{i:02d}.svg", "w").write(mini(s))
        open("/tmp/x.svg", "w").write(s)
        subprocess.run(["rsvg-convert", "/tmp/x.svg", "-o", f"out2/f{i:02d}.png"], check=True)
        pngs.append(f"out2/f{i:02d}.png")
    for i, (n, bk, f) in enumerate(OVER):
        ov = f()
        open(f"out2/o{i:02d}.svg", "w").write(mini(ov))
        comp = base[bk].rsplit("</svg>", 1)[0] + ov.split(">", 1)[1]
        open("/tmp/x.svg", "w").write(comp)
        subprocess.run(["rsvg-convert", "/tmp/x.svg", "-o", f"out2/o{i:02d}.png"], check=True)
        pngs.append(f"out2/o{i:02d}.png")
    for part in range(0, len(pngs), 8):
        chunk = pngs[part:part + 8]
        sh = Image.new("RGB", (len(chunk) * 370, 810), "#888")
        for k, p in enumerate(chunk):
            sh.paste(Image.open(p), (k * 370, 5))
        sh.save(f"out2/sheet{part // 8}.png")
    print(len(pngs))
