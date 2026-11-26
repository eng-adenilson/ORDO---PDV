/**
 * Interpreta a fala do vendedor (SPEC §6). Puro e testável — não depende de módulo nativo.
 *
 *  "2 metalon 30 por 20"            → { qty: 2, query: "metalon 30x20" }
 *  "duas chapas 20"                 → { qty: 2, query: "chapa 20" }
 *  "chapa 20"                       → { qty: null, query: "chapa 20" }   (20 é a bitola, não a quantidade)
 *  "tubo de PVC de 100 milímetros"  → { qty: null, query: "tubo pvc 100mm" }
 *  "metalon 30 por 20, 3 unidades"  → { qty: 3, query: "metalon 30x20" }
 *
 * Regra: quantidade só é reconhecida no INÍCIO da frase ou seguida de "unidade(s)/peça(s)/un".
 * Números no meio da frase são medida/especificação. Sem quantidade → qty null (o carrinho usa 1).
 */
const NUMBER_WORDS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  onze: 11, doze: 12, quinze: 15, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, cem: 100,
};
const UNIT_WORDS = /^(unidades?|un|pecas?|pcs?)$/;
const STOPWORDS = new Set(['de', 'do', 'da', 'dos', 'das', 'o', 'a', 'os', 'as', 'com', 'e']);
const UNITS: [RegExp, string][] = [[/^(milimetros?|mm)$/, 'mm'], [/^(centimetros?|cm)$/, 'cm'], [/^(metros?)$/, 'm'], [/^(polegadas?)$/, '"'], [/^(quilos?|kg)$/, 'kg']];

export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.,;!?]/g, ' ').replace(/\s+/g, ' ').trim();
}

function toNumber(tok: string): number | null {
  if (/^\d+$/.test(tok)) return Number(tok);
  return NUMBER_WORDS[tok] ?? null;
}

function singular(tok: string): string {
  if (tok.length > 4 && tok.endsWith('s') && !/\d/.test(tok)) return tok.slice(0, -1);
  return tok;
}

export function parseVoiceQuery(transcript: string): { qty: number | null; query: string } {
  let toks = normalize(transcript).split(' ').filter(Boolean);
  let qty: number | null = null;

  // "..., 3 unidades"
  for (let i = 0; i < toks.length - 1; i++) {
    const n = toNumber(toks[i]!);
    if (n !== null && UNIT_WORDS.test(toks[i + 1]!)) { qty = n; toks.splice(i, 2); break; }
  }
  // quantidade no início: "2 metalon ..." / "duas chapas ..."
  if (qty === null && toks.length > 1) {
    const n = toNumber(toks[0]!);
    if (n !== null && toNumber(toks[1]!) === null) { qty = n; toks = toks.slice(1); }
  }

  const out: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]!;
    const next = toks[i + 1];
    // "30 por 20" / "30 x 20" → "30x20"
    if (/^\d+$/.test(t) && (next === 'por' || next === 'x') && toks[i + 2] && /^\d+$/.test(toks[i + 2]!)) {
      out.push(`${t}x${toks[i + 2]}`); i += 2; continue;
    }
    // "100 milímetros" → "100mm"
    const unit = next ? UNITS.find(([re]) => re.test(next)) : undefined;
    if (/^\d+$/.test(t) && unit) { out.push(`${t}${unit[1]}`); i += 1; continue; }
    const w = toNumber(t);
    if (STOPWORDS.has(t)) continue;
    out.push(w !== null && !/^\d+$/.test(t) && out.length > 0 ? String(w) : singular(t));
  }
  return { qty: qty !== null && qty > 0 ? qty : null, query: out.join(' ') };
}

/** Tokens para busca tolerante (nome do produto e consulta normalizados do mesmo jeito). */
export function searchTokens(s: string): string[] {
  return normalize(s).replace(/(\d+)\s*(x|por)\s*(\d+)/g, '$1x$3').split(' ').filter((t) => t && !STOPWORDS.has(t)).map(singular);
}
