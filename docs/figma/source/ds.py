"""ORDO design system — SVG component helpers for 360x800 Android screens.

Tokens come from logo B "Grade" (dark ink grid + yellow moving box).
Every interactive element is >= 44px tall (Web Interface Guidelines: touch targets).
"""
from xml.sax.saxutils import escape

W, H = 360, 800
C = dict(
    ink="#1A1A1A", ink2="#3A3A3A", muted="#5F5F5F", line="#E4E2DA", bg="#F7F6F2",
    card="#FFFFFF", brand="#F2B705", brandSoft="#FFF4CC", ok="#1E7F4F", okSoft="#E3F3EA",
    danger="#C62828", dangerSoft="#FDE8E8", warn="#8A4B00", warnSoft="#FDECC8",
)
FONT = "Inter"


def t(x, y, s, size=14, w=400, fill=None, anchor="start", ls=0):
    fill = fill or C["ink"]
    return (f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{w}" '
            f'fill="{fill}" text-anchor="{anchor}" letter-spacing="{ls}">{escape(str(s))}</text>')


def r(x, y, w, h, fill=None, rx=0, stroke=None, sw=1):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill or "none"}"{st}/>'


# ---------- icons (24px box, stroke 2) ----------
def icon(name, x, y, color=None, s=24):
    c = color or C["ink"]
    k = s / 24
    g = f'<g transform="translate({x} {y}) scale({k})" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    p = {
        "search": '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
        "mic": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
        "plus": '<path d="M12 5v14M5 12h14"/>',
        "minus": '<path d="M5 12h14"/>',
        "back": '<path d="M15 5l-7 7 7 7"/>',
        "chev": '<path d="M9 5l7 7-7 7"/>',
        "x": '<path d="M6 6l12 12M18 6L6 18"/>',
        "cart": '<path d="M3 4h2l2.5 11h11L21 7H6.5"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
        "box": '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
        "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        "cash": '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
        "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
        "more": '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
        "barcode": '<path d="M4 5v14M7 5v14M11 5v14M14 5v14M18 5v14M20 5v14"/>',
        "trash": '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
        "download": '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
        "cloud": '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9z"/><path d="M4 4l16 16"/>',
        "alert": '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
        "check": '<path d="M5 12l5 5 9-10"/>',
        "truck": '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
        "tag": '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
        "lock": '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
        "pix": '<path d="M12 3l9 9-9 9-9-9z"/><path d="M8 12h8"/>',
        "card": '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
        "camera": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13.5" r="3.5"/>',
        "image": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
    }[name]
    return g + p + "</g>"


def logo(x, y, s=32, dark=True):
    ink = C["ink"] if dark else "#FFFFFF"
    k = s / 256
    cells = [(32, 32), (100, 32), (32, 100), (168, 100), (32, 168), (100, 168), (168, 168)]
    rects = "".join(f'<rect x="{a}" y="{b}" width="56" height="56" rx="8"/>' for a, b in cells)
    return (f'<g transform="translate({x} {y}) scale({k})"><g fill="{ink}">{rects}</g>'
            f'<rect x="172" y="26" width="48" height="48" rx="7" fill="{C["brand"]}" transform="rotate(15 196 50)"/></g>')


# ---------- chrome ----------
def statusbar(dark=False):
    c = "#FFFFFF" if dark else C["ink"]
    return t(20, 30, "9:41", 14, 600, c) + r(300, 20, 18, 10, c, 2) + r(322, 20, 18, 10, c, 2)


def appbar(title, back=True, action=None, sub=None):
    out = r(0, 0, W, 104, C["card"]) + statusbar() + r(0, 103, W, 1, C["line"])
    x = 20
    if back:
        out += icon("back", 16, 62)
        x = 56
    out += t(x, 80, title, 20, 700)
    if sub:
        out += t(x, 98, sub, 12, 400, C["muted"])
    if action:
        out += icon(action, 316, 62)
    return out


TABS = [("cart", "Vender"), ("box", "Estoque"), ("clock", "Histórico"), ("cash", "Caixa"), ("more", "Mais")]


def tabbar(active):
    out = r(0, H - 72, W, 72, C["card"]) + r(0, H - 72, W, 1, C["line"])
    cw = W / 5
    for i, (ic, lb) in enumerate(TABS):
        cx = cw * i + cw / 2
        on = lb == active
        if on:
            out += r(cx - 28, H - 64, 56, 32, C["brandSoft"], 16)
        out += icon(ic, cx - 12, H - 60, C["ink"] if on else C["muted"])
        out += t(cx, H - 16, lb, 12, 700 if on else 500, C["ink"] if on else C["muted"], "middle")
    return out


# ---------- components ----------
def button(x, y, w, label, kind="primary", h=52, ic=None):
    fill, fg, st = {"primary": (C["ink"], "#FFFFFF", None), "brand": (C["brand"], C["ink"], None),
                    "ghost": (C["card"], C["ink"], C["line"]), "danger": (C["danger"], "#FFFFFF", None)}[kind]
    out = r(x, y, w, h, fill, 12, st)
    if ic:
        tw = len(label) * 8.2 + 32
        sx = x + (w - tw) / 2
        out += icon(ic, sx, y + h / 2 - 12, fg) + t(sx + 32, y + h / 2 + 5, label, 16, 600, fg)
    else:
        out += t(x + w / 2, y + h / 2 + 5, label, 16, 600, fg, "middle")
    return out


def field(x, y, w, label, value="", ph="", req=False, ic=None, err=None, suffix=None):
    lab = label + (" *" if req else "")
    out = t(x, y + 14, lab, 13, 600, C["ink2"])
    bc = C["danger"] if err else C["line"]
    out += r(x, y + 22, w, 48, C["card"], 10, bc, 1.5 if err else 1)
    tx = x + 14
    if ic:
        out += icon(ic, x + 12, y + 34, C["muted"])
        tx = x + 44
    out += t(tx, y + 51, value or ph, 15, 400, C["ink"] if value else C["muted"])
    if suffix:
        out += icon(suffix, x + w - 36, y + 34, C["ink"])
    if err:
        out += t(x, y + 88, err, 12, 500, C["danger"])
    return out


def chip(x, y, label, on=False, w=None):
    w = w or len(label) * 7.6 + 28
    out = r(x, y, w, 36, C["ink"] if on else C["card"], 18, None if on else C["line"])
    return out + t(x + w / 2, y + 23, label, 13, 600, "#FFFFFF" if on else C["ink"], "middle"), w


def badge(x, y, label, kind):
    bg, fg = {"low": (C["warnSoft"], C["warn"]), "out": (C["dangerSoft"], C["danger"]),
              "ok": (C["okSoft"], C["ok"]), "neutral": ("#EEEDE8", C["ink2"])}[kind]
    w = len(label) * 6.6 + 16
    return r(x, y, w, 22, bg, 11) + t(x + w / 2, y + 15, label, 11, 700, fg, "middle"), w


def thumb(x, y, s=48, photo=True):
    if photo:
        return r(x, y, s, s, "#ECEAE3", 10) + icon("box", x + s / 2 - 12, y + s / 2 - 12, "#9C9A92")
    return r(x, y, s, s, "#ECEAE3", 10) + icon("image", x + s / 2 - 12, y + s / 2 - 12, "#9C9A92")


def stepper(x, y, n):
    out = r(x, y, 120, 44, C["card"], 22, C["line"])
    out += icon("minus", x + 10, y + 10) + t(x + 60, y + 28, n, 16, 700, anchor="middle") + icon("plus", x + 86, y + 10)
    return out


def card(x, y, w, h):
    return r(x, y, w, h, C["card"], 14, C["line"])


def screen(name, body, bg=None):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
            f'{r(0, 0, W, H, bg or C["bg"])}{body}</svg>')


def money(v):
    s = f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return "R$ " + s
