from ds import *


def wrap2(n, k):
    words, l1 = n.split(), ""
    while words and len((l1 + " " + words[0]).strip()) <= k:
        l1 = (l1 + " " + words.pop(0)).strip()
    return l1, " ".join(words)

P = [  # nome, código, preço, estoque
    ("Metalon 30x20 #18 6m", "MET3020", 89.90, 24),
    ("Chapa galvanizada nº 20", "CHG20", 145.00, 3),
    ("Tubo PVC 100mm 6m", "PVC100", 79.50, 12),
    ("Cimento CP-II 50kg", "CIM50", 38.90, 0),
    ("Disco de corte 7\"", "DSC7", 12.90, 40),
    ("Fita veda-rosca 18mm", "FVR18", 4.50, 65),
]


def login():
    b = statusbar()
    b += logo(140, 150, 80)
    b += t(180, 270, "ORDO", 32, 800, anchor="middle", ls=2)
    b += t(180, 296, "Ponto de venda da sua loja", 14, 400, C["muted"], "middle")
    b += field(24, 350, 312, "Usuário", "joao.balcao", ic="user")
    b += field(24, 440, 312, "Senha", "••••••••", ic="lock")
    b += t(336, 538, "Esqueci a senha", 13, 600, C["ink"], "end")
    b += button(24, 566, 312, "Entrar", "primary")
    b += t(180, 760, "Versão 1.0 · funciona sem internet", 12, 400, C["muted"], "middle")
    return screen("Login", b)


def vendas():
    b = r(0, 0, W, 176, C["card"]) + statusbar()
    b += logo(20, 50, 28) + t(56, 72, "Vender", 20, 700)
    b += t(340, 70, "João", 13, 600, C["muted"], "end")
    # offline/sync banner
    b += r(0, 96, W, 0, C["card"])
    b += r(20, 96, 320, 56, C["bg"], 12, C["line"])
    b += icon("search", 34, 112, C["muted"]) + t(68, 129, "Buscar produto pelo nome…", 15, 400, C["muted"])
    b += r(284, 100, 48, 48, C["brand"], 10) + icon("mic", 296, 112)
    b += r(0, 175, W, 1, C["line"])
    b += r(20, 188, 320, 36, C["warnSoft"], 10) + icon("cloud", 30, 194, C["warn"])
    b += t(60, 211, "Sem internet · 2 vendas aguardando envio", 12, 600, C["warn"])
    x = 20
    for i, lb in enumerate(["Todos", "Metalon", "Chapas", "Hidráulica", "Elétrica"]):
        s, w = chip(x, 236, lb, i == 0)
        b += s
        x += w + 8
    # grid 2 cols
    for i, (n, c, p, q) in enumerate(P[:4]):
        cx, cy = 20 + (i % 2) * 164, 288 + (i // 2) * 196
        b += card(cx, cy, 156, 184) + r(cx + 8, cy + 8, 140, 88, "#ECEAE3", 10) + icon("box", cx + 66, cy + 40, "#9C9A92")
        l1, l2 = wrap2(n, 19)
        b += t(cx + 12, cy + 116, l1, 13, 600) + t(cx + 12, cy + 132, l2, 13, 600) + t(cx + 12, cy + 150, c, 11, 500, C["muted"])
        b += t(cx + 12, cy + 172, money(p), 15, 700)
        b += r(cx + 108, cy + 140, 40, 40, C["ink"], 10) + icon("plus", cx + 116, cy + 148, "#FFFFFF")
    # cart bar
    b += r(16, 664, 328, 56, C["ink"], 14)
    b += r(28, 676, 32, 32, C["brand"], 16) + t(44, 697, "3", 14, 800, anchor="middle")
    b += t(72, 698, "Ver carrinho", 15, 600, "#FFFFFF") + t(328, 698, money(269.30), 16, 700, "#FFFFFF", "end")
    b += tabbar("Vender")
    return screen("Vendas", b)


def voz():
    b = vendas().split(">", 1)[1].rsplit("</svg>", 1)[0]
    b += r(0, 0, W, H, "#000000").replace('fill="#000000"', 'fill="#000000" fill-opacity="0.45"')
    b += r(0, 300, W, 500, C["card"], 24) + r(156, 312, 48, 4, C["line"], 2)
    b += t(20, 350, "Busca por voz", 18, 700) + icon("x", 316, 330)
    b += r(20, 366, 320, 64, C["brandSoft"], 14) + r(32, 378, 40, 40, C["brand"], 20) + icon("mic", 40, 386)
    b += t(84, 394, "Você disse:", 12, 500, C["muted"]) + t(84, 414, "“2 metalon 30 por 20”", 16, 700)
    b += t(20, 458, "Toque no produto certo", 13, 600, C["ink2"])
    b, _ = b, None
    rows = [("Metalon 30x20 #18 6m", "MET3020", 89.90, True), ("Metalon 30x20 #20 6m", "MET3020F", 79.90, False),
            ("Metalon 30x30 #18 6m", "MET3030", 99.90, False)]
    for i, (n, c, p, sel) in enumerate(rows):
        y = 470 + i * 72
        b += r(20, y, 320, 64, C["card"], 12, C["ink"] if sel else C["line"], 2 if sel else 1)
        b += thumb(30, y + 8) + t(90, y + 28, n, 14, 600) + t(90, y + 48, c + " · " + money(p), 12, 500, C["muted"])
        if sel:
            s, _w = badge(276, y + 21, "Qtd 2", "neutral")
            b += s
    b += button(20, 700, 152, "Falar de novo", "ghost", ic="mic") + button(184, 700, 156, "Adicionar 2", "primary")
    return screen("Vendas — busca por voz", b)


def carrinho():
    b = appbar("Carrinho", sub="3 produtos · 7 unidades") + ""
    items = [("Metalon 30x20 #18 6m", 89.90, 2, "10%"), ("Chapa galvanizada nº 20", 145.00, 4, None),
             ("Fita veda-rosca 18mm", 4.50, 1, None)]
    y = 120
    for n, p, q, d in items:
        h = 128 if n.startswith("Chapa") else 116
        b += card(16, y, 328, h) + thumb(28, y + 12)
        b += t(88, y + 30, n, 14, 600) + icon("trash", 308, y + 14, C["muted"], 20)
        if d:
            b += t(88, y + 50, money(p), 12, 500, C["muted"]) + r(88, y + 45, 60, 1, C["muted"])
            b += t(156, y + 50, money(p * 0.9), 13, 700, C["ok"])
            s, _ = badge(250, y + 36, "-" + d, "ok")
            b += s
        else:
            b += t(88, y + 50, money(p), 13, 600)
        b += stepper(28, y + 62, str(q))
        b += r(160, y + 62, 92, 44, C["card"], 22, C["line"]) + icon("tag", 172, y + 72, C["ink"], 20) + t(198, y + 89, "Desc.", 13, 600)
        b += t(330, y + 90, money(p * q * (0.9 if d else 1)), 15, 700, anchor="end")
        if h == 128:
            b += r(28, y + 112, 0, 0)
        y += h + 12
    # stock alert on chapa
    b += r(16, y, 328, 60, C["dangerSoft"], 12, C["danger"]) + icon("alert", 28, y + 18, C["danger"])
    b += t(60, y + 26, "Chapa galvanizada nº 20: só 3 em estoque", 13, 700, C["danger"])
    b += t(60, y + 44, "Ajuste a quantidade para finalizar.", 12, 500, C["danger"])
    # totals
    b += r(0, 600, W, 200, C["card"]) + r(0, 600, W, 1, C["line"])
    b += t(20, 630, "Subtotal", 14, 500, C["muted"]) + t(340, 630, money(764.30), 14, 600, anchor="end")
    b += t(20, 654, "Descontos", 14, 500, C["muted"]) + t(340, 654, "- " + money(17.98), 14, 600, C["ok"], "end")
    b += t(20, 690, "Total", 18, 700) + t(340, 690, money(746.32), 22, 800, anchor="end")
    b += r(20, 716, 320, 56, "#D9D7CF", 12) + t(180, 750, "Ir para pagamento", 16, 600, "#7A786F", "middle")
    return screen("Carrinho", b)


def pagamento():
    b = appbar("Pagamento")
    b += card(16, 120, 328, 112) + t(180, 156, "Total a receber", 13, 600, C["muted"], "middle")
    b += t(180, 200, money(456.32), 36, 800, anchor="middle")
    b += t(20, 266, "Forma de pagamento", 15, 700)
    opts = [("pix", "Pix"), ("cash", "Dinheiro"), ("card", "Crédito"), ("card", "Débito")]
    for i, (ic, lb) in enumerate(opts):
        x, y = 16 + (i % 2) * 168, 280 + (i // 2) * 84
        sel = i == 0
        b += r(x, y, 160, 72, C["brandSoft"] if sel else C["card"], 14, C["ink"] if sel else C["line"], 2 if sel else 1)
        b += icon(ic, x + 16, y + 24) + t(x + 52, y + 42, lb, 16, 600)
        if sel:
            b += r(x + 124, y + 24, 24, 24, C["ink"], 12) + icon("check", x + 128, y + 28, "#FFFFFF", 16)
    b += t(20, 484, "Cliente (opcional)", 15, 700)
    b += r(16, 498, 328, 56, C["card"], 12, C["line"]) + icon("user", 30, 514, C["muted"])
    b += t(64, 531, "Buscar ou cadastrar cliente", 15, 400, C["muted"]) + icon("plus", 306, 514)
    b += card(16, 570, 328, 96)
    b += t(32, 598, "5 itens · desconto " + money(17.98), 13, 500, C["muted"])
    b += t(32, 624, "Vendedor: João", 13, 500, C["muted"])
    b += t(32, 650, "Estoque será baixado ao confirmar", 13, 600, C["ink2"])
    b += button(20, 716, 320, "Confirmar venda", "brand", 56)
    return screen("Pagamento", b)


def cliente_rapido():
    b = pagamento().split(">", 1)[1].rsplit("</svg>", 1)[0]
    b += '<rect x="0" y="0" width="360" height="800" fill="#000000" fill-opacity="0.45"/>'
    b += r(0, 360, W, 440, C["card"], 24) + r(156, 372, 48, 4, C["line"], 2)
    b += t(20, 410, "Novo cliente", 18, 700) + icon("x", 316, 390)
    b += t(20, 432, "Só nome e telefone — leva 10 segundos.", 13, 400, C["muted"])
    b += field(20, 452, 320, "Nome", "Marcos Pereira", req=True)
    b += field(20, 540, 320, "Telefone", "(61) 9 8123-4", ph="", req=True)
    b += button(20, 720, 320, "Salvar e usar nesta venda", "primary")
    return screen("Cadastro rápido de cliente", b)


def clientes():
    b = appbar("Clientes", back=True, action="plus")
    b += r(16, 116, 328, 52, C["card"], 12, C["line"]) + icon("search", 30, 130, C["muted"])
    b += t(64, 147, "Buscar por nome ou telefone…", 15, 400, C["muted"])
    names = [("Ana Lúcia Rocha", "(61) 9 9811-2034", "12 compras"), ("Construtora Bom Tijolo", "(61) 3344-1200", "48 compras"),
             ("Marcos Pereira", "(61) 9 8123-4455", "1 compra"), ("Paulo Serralheiro", "(61) 9 9654-7788", "23 compras"),
             ("Rita de Cássia", "(61) 9 9120-0099", "5 compras"), ("Valdir Elétrica", "(61) 9 8877-6655", "9 compras")]
    for i, (n, tel, k) in enumerate(names):
        y = 184 + i * 76
        b += card(16, y, 328, 68) + r(28, y + 14, 40, 40, C["brandSoft"], 20)
        b += t(48, y + 40, n[0], 16, 700, anchor="middle")
        b += t(80, y + 30, n, 15, 600) + t(80, y + 50, tel + " · " + k, 12, 500, C["muted"]) + icon("chev", 312, y + 22, C["muted"])
    b += tabbar("Mais")
    return screen("Clientes", b)


def produto():
    b = appbar("Novo produto", action=None)
    b += r(16, 120, 96, 96, C["card"], 14, C["line"]) + icon("camera", 52, 146, C["muted"])
    b += t(64, 200, "Foto", 12, 600, C["muted"], "middle")
    b += t(128, 150, "Foto opcional", 14, 600) + t(128, 172, "Ajuda o vendedor a achar", 12, 400, C["muted"])
    b += t(128, 188, "o produto na busca.", 12, 400, C["muted"])
    b += field(16, 232, 328, "Nome", "Metalon 30x20 #18 6m", req=True)
    b += field(16, 314, 328, "Código", "MET3020", req=True, suffix="barcode")
    b += field(16, 396, 158, "Categoria", "Metalon") + field(186, 396, 158, "Status", "Ativo")
    b += field(16, 478, 158, "Preço de custo", "R$ 61,40") + field(186, 478, 158, "Preço de venda", "R$ 89,90")
    b += field(16, 560, 328, "Descrição", "", ph="Ex.: parede 1,20 mm, galvanizado")
    b += t(16, 662, "O estoque inicial entra pela tela Entrada de mercadorias.", 12, 500, C["muted"])
    b += button(16, 716, 328, "Salvar produto", "primary", 56)
    return screen("Cadastro de produto", b)


def entrada():
    b = appbar("Entrada de mercadorias")
    s1, _ = chip(16, 116, "Produto existente", True, 160)
    s2, _ = chip(184, 116, "Produto novo", False, 160)
    b += s1 + s2
    b += card(16, 164, 328, 72) + thumb(28, 176) + t(88, 194, "Chapa galvanizada nº 20", 15, 600)
    b += t(88, 216, "CHG20 · em estoque: 3", 12, 500, C["muted"]) + t(330, 206, "Trocar", 13, 700, anchor="end")
    b += field(16, 248, 158, "Qtd recebida", "20", req=True) + field(186, 248, 158, "Novo saldo", "23")
    b += field(16, 330, 158, "Preço de custo", "R$ 98,00") + field(186, 330, 158, "Preço de venda", "R$ 145,00")
    b += field(16, 412, 328, "Fornecedor", "Aço Forte Distribuidora", req=True, ic="truck", suffix="chev")
    b += t(16, 518, "Últimas entradas deste produto", 14, 700)
    for i, (d, q, f, c) in enumerate([("18/11", "+15", "Aço Forte", "R$ 96,50"), ("02/11", "+10", "Metais Planalto", "R$ 95,00")]):
        y = 532 + i * 60
        b += card(16, y, 328, 52) + t(30, y + 32, d, 13, 600) + t(84, y + 32, f, 13, 500, C["ink2"])
        b += t(250, y + 32, c, 13, 500, C["muted"], "end") + t(330, y + 32, q, 14, 700, C["ok"], "end")
    b += button(16, 716, 328, "Registrar entrada", "primary", 56)
    return screen("Entrada de mercadorias", b)


def estoque():
    b = appbar("Estoque", back=False, action="download", sub="Somente consulta · atualizado agora")
    k = [("Produtos", "312"), ("Unidades", "8.430"), ("Valor a custo", "R$ 184,2 mil"),
         ("Valor de venda", "R$ 276,9 mil"), ("Sem estoque", "7"), ("Estoque baixo", "18")]
    for i, (lb, v) in enumerate(k):
        x, y = 16 + (i % 3) * 112, 116 + (i // 3) * 76
        tone = C["danger"] if lb == "Sem estoque" else C["warn"] if lb == "Estoque baixo" else C["ink"]
        b += card(x, y, 104, 68) + t(x + 12, y + 24, lb, 11, 600, C["muted"]) + t(x + 12, y + 52, v, 15 if len(v) > 8 else 18, 800, tone)
    b += r(16, 276, 328, 48, C["card"], 12, C["line"]) + icon("search", 30, 288, C["muted"])
    b += t(64, 305, "Nome ou código…", 15, 400, C["muted"]) + icon("barcode", 306, 288)
    x = 16
    for i, lb in enumerate(["Todos", "Baixo", "Zerado"]):
        s, w = chip(x, 334, lb, i == 0)
        b += s
        x += w + 8
    rows = [("Cimento CP-II 50kg", "CIM50", 0, "out"), ("Chapa galvanizada nº 20", "CHG20", 3, "low"),
            ("Tubo PVC 100mm 6m", "PVC100", 12, None), ("Metalon 30x20 #18 6m", "MET3020", 24, None),
            ("Disco de corte 7\"", "DSC7", 40, None)]
    for i, (n, c, q, st) in enumerate(rows):
        y = 382 + i * 68
        bg = C["dangerSoft"] if st == "out" else C["card"]
        b += r(16, y, 328, 60, bg, 12, C["line"]) + t(28, y + 26, n, 14, 600) + t(28, y + 46, c, 12, 500, C["muted"])
        if st:
            s, w = badge(332 - 70, y + 8, "Zerado" if st == "out" else "Baixo", st)
            b += s
        b += t(332, y + 48, f"{q} un", 15, 700, C["danger"] if st == "out" else C["ink"], "end")
    b += tabbar("Estoque")
    return screen("Consulta de estoque", b)


def historico():
    b = appbar("Histórico de vendas", back=False, sub="Hoje, 24/11")
    x = 16
    for i, lb in enumerate(["Hoje", "Ontem", "7 dias", "Canceladas"]):
        s, w = chip(x, 116, lb, i == 0)
        b += s
        x += w + 8
    v = [("#1048", "16:42", "João", "Pix", 456.32, None), ("#1047", "16:10", "Carla", "Dinheiro", 89.90, None),
         ("#1046", "15:55", "João", "Crédito", 1240.00, "canc"), ("#1045", "15:31", "João", "Débito", 38.90, "sync"),
         ("#1044", "14:02", "Carla", "Pix", 312.40, None), ("#1043", "11:18", "João", "Dinheiro", 57.00, None)]
    for i, (idv, h, vend, pg, val, st) in enumerate(v):
        y = 168 + i * 82
        b += card(16, y, 328, 74) + t(30, y + 28, f"Venda {idv}", 15, 700) + t(30, y + 52, f"{h} · {vend} · {pg}", 12, 500, C["muted"])
        if st == "canc":
            s, _ = badge(330 - (9 * 6.6 + 16), y + 40, "Cancelada", "out")
            b += s + t(330, y + 30, money(val), 15, 700, C["muted"], "end") + r(330 - 92, y + 25, 92, 1, C["muted"])
        else:
            b += t(330, y + 30, money(val), 15, 700, anchor="end")
            if st == "sync":
                s, _ = badge(330 - (16 * 6.6 + 16), y + 40, "Aguardando envio", "low")
                b += s
    b += tabbar("Histórico")
    return screen("Histórico de vendas", b)


def venda_detalhe():
    b = appbar("Venda #1048", sub="24/11/2026 · 16:42")
    b += card(16, 116, 328, 96)
    for i, (k_, v_) in enumerate([("Vendedor", "João"), ("Cliente", "Marcos Pereira"), ("Pagamento", "Pix")]):
        b += t(30, 142 + i * 24, k_, 13, 500, C["muted"]) + t(330, 142 + i * 24, v_, 13, 600, anchor="end")
    b += t(16, 240, "Itens", 15, 700)
    its = [("Metalon 30x20 #18 6m", "2 × R$ 80,91", "-10%", 161.82), ("Chapa galvanizada nº 20", "2 × R$ 145,00", None, 290.00),
           ("Fita veda-rosca 18mm", "1 × R$ 4,50", None, 4.50)]
    for i, (n, q, d, v_) in enumerate(its):
        y = 254 + i * 64
        b += card(16, y, 328, 56) + t(30, y + 24, n, 14, 600) + t(30, y + 44, q, 12, 500, C["muted"])
        if d:
            s, _ = badge(130, y + 31, d, "ok")
            b += s
        b += t(330, y + 34, money(v_), 14, 700, anchor="end")
    b += t(30, 474, "Descontos", 13, 500, C["muted"]) + t(330, 474, "- " + money(17.98), 13, 600, C["ok"], "end")
    b += t(30, 504, "Total", 17, 700) + t(330, 504, money(456.32), 20, 800, anchor="end")
    b += t(16, 560, "Vendas finalizadas não podem ser editadas.", 12, 500, C["muted"])
    b += t(16, 578, "Para corrigir, cancele e faça uma nova venda.", 12, 500, C["muted"])
    b += button(16, 716, 328, "Cancelar venda", "ghost", 56)
    # modal
    b += '<rect x="0" y="0" width="360" height="800" fill="#000000" fill-opacity="0.45"/>'
    b += r(16, 236, 328, 360, C["card"], 20)
    b += r(32, 256, 40, 40, C["dangerSoft"], 20) + icon("alert", 40, 264, C["danger"])
    b += t(32, 326, "Cancelar venda #1048?", 18, 700)
    b += t(32, 350, "Os 5 itens voltam ao estoque. A venda fica", 13, 400, C["ink2"])
    b += t(32, 368, "no histórico marcada como cancelada.", 13, 400, C["ink2"])
    b += field(32, 384, 296, "Motivo do cancelamento", "", ph="Ex.: cliente desistiu", req=True,
               err="Informe o motivo para continuar.")
    b += button(32, 516, 140, "Voltar", "ghost", 52) + button(184, 516, 144, "Cancelar venda", "danger", 52)
    return screen("Histórico — cancelar venda", b)


def caixa():
    b = appbar("Caixa de hoje", back=False, sub="Aberto às 08:02 por Carla · troco R$ 150,00")
    b += r(16, 116, 328, 100, C["ink"], 16)
    b += t(32, 146, "Vendas líquidas", 13, 600, "#BDBBB3") + t(32, 184, money(3842.70), 28, 800, "#FFFFFF")
    b += t(32, 204, "27 vendas · 2 canceladas", 12, 500, "#BDBBB3")
    b += logo(296, 128, 32, dark=False)
    k = [("Bruto", money(3958.20)), ("Descontos", "- " + money(115.50)), ("Cancelado", money(1329.90))]
    for i, (lb, v) in enumerate(k):
        x = 16 + i * 112
        b += card(x, 228, 104, 60) + t(x + 10, 250, lb, 11, 600, C["muted"]) + t(x + 10, 274, v, 12, 800,
                                                                                 C["danger"] if lb == "Cancelado" else C["ink"])
    b += t(16, 316, "Por forma de pagamento", 15, 700)
    for i, (ic, lb, v) in enumerate([("pix", "Pix", 1984.30), ("cash", "Dinheiro", 812.40), ("card", "Crédito", 640.00),
                                    ("card", "Débito", 406.00)]):
        y = 326 + i * 40
        b += icon(ic, 18, y + 8, C["ink2"]) + t(52, y + 26, lb, 14, 500) + t(342, y + 26, money(v), 14, 700, anchor="end")
        b += r(16, y + 39, 328, 1, C["line"])
    b += t(16, 510, "Fechamento", 15, 700)
    b += card(16, 520, 328, 128)
    b += t(30, 546, "Esperado em dinheiro", 13, 500, C["muted"]) + t(330, 546, money(962.40), 13, 700, anchor="end")
    b += t(30, 564, "(troco R$ 150,00 + vendas R$ 812,40)", 11, 400, C["muted"])
    b += t(30, 592, "Contado", 13, 500, C["muted"]) + t(330, 592, money(952.40), 13, 700, anchor="end")
    b += r(30, 604, 300, 34, C["dangerSoft"], 8) + t(42, 626, "Diferença", 13, 700, C["danger"])
    b += t(318, 626, "- " + money(10.00), 13, 800, C["danger"], "end")
    b += button(16, 660, 156, "Exportar Excel", "ghost", 52) + button(184, 660, 160, "Fechar caixa", "primary", 52)
    b += tabbar("Caixa")
    return screen("Relatório diário e caixa", b)


def mais():
    b = appbar("Mais", back=False)
    b += card(16, 116, 328, 72) + r(28, 130, 44, 44, C["brandSoft"], 22) + t(50, 158, "J", 18, 800, anchor="middle")
    b += t(84, 146, "João da Silva", 16, 700) + t(84, 168, "Vendedor · sair da conta", 12, 500, C["muted"])
    items = [("user", "Clientes", "Cadastro e consulta"), ("tag", "Produtos", "Cadastrar e editar produtos"),
             ("truck", "Entrada de mercadorias", "Reposição e produtos novos"), ("cloud", "Sincronização", "2 vendas aguardando envio")]
    for i, (ic, n, s) in enumerate(items):
        y = 204 + i * 76
        b += card(16, y, 328, 68) + r(28, y + 14, 40, 40, C["bg"], 10) + icon(ic, 36, y + 22)
        b += t(80, y + 30, n, 15, 600) + t(80, y + 50, s, 12, 500, C["warn"] if ic == "cloud" else C["muted"]) + icon("chev", 312, y + 22, C["muted"])
    b += tabbar("Mais")
    return screen("Mais", b)


SCREENS = [("01 Login", login), ("02 Vendas", vendas), ("02b Vendas — busca por voz", voz),
           ("03 Carrinho", carrinho), ("03b Pagamento", pagamento), ("04 Cadastro rápido de cliente", cliente_rapido),
           ("05 Clientes", clientes), ("06 Cadastro de produto", produto), ("07 Entrada de mercadorias", entrada),
           ("08 Consulta de estoque", estoque), ("09 Histórico de vendas", historico),
           ("09b Venda — cancelar", venda_detalhe), ("10 Relatório diário e caixa", caixa), ("11 Mais", mais)]

if __name__ == "__main__":
    import os, subprocess
    os.makedirs("out", exist_ok=True)
    for i, (n, f) in enumerate(SCREENS):
        fn = f"out/{i:02d}.svg"
        open(fn, "w").write(f())
        subprocess.run(["rsvg-convert", fn, "-o", fn.replace(".svg", ".png")], check=True)


def abrir_caixa():
    b = appbar("Abrir caixa", back=False, sub="Terça, 24/11 · nenhum caixa aberto")
    b += r(16, 120, 328, 120, C["brandSoft"], 16) + logo(32, 140, 40)
    b += t(88, 160, "Bom dia, Carla", 18, 700) + t(88, 182, "Informe o dinheiro que está", 13, 400, C["ink2"])
    b += t(88, 200, "na gaveta para troco.", 13, 400, C["ink2"])
    b += field(16, 260, 328, "Valor inicial para troco", "R$ 150,00", req=True, ic="cash")
    b += t(16, 362, "Atalhos", 13, 600, C["ink2"])
    x = 16
    for v in ["R$ 50", "R$ 100", "R$ 150", "R$ 200"]:
        s, w = chip(x, 374, v, v == "R$ 150", 74)
        b += s
        x += 82
    b += card(16, 430, 328, 92) + t(30, 458, "Último fechamento", 13, 600, C["muted"])
    b += t(30, 482, "Ontem 18:04 · por João", 14, 600) + t(30, 504, "Contado R$ 1.212,00 · sem diferença", 12, 500, C["ok"])
    b += t(16, 560, "Vendas em dinheiro serão somadas a esse valor", 12, 500, C["muted"])
    b += t(16, 578, "para calcular o esperado no fechamento.", 12, 500, C["muted"])
    b += button(16, 660, 328, "Abrir caixa", "brand", 56)
    b += tabbar("Caixa")
    return screen("Abrir caixa", b)
