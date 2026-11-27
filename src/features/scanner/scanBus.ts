/** Devolve o código lido (câmera ou digitado) para a tela que abriu o scanner. */
type Listener = (code: string) => void;
let listener: Listener | null = null;

export function openScanner(onCode: Listener) { listener = onCode; }
export function emitScan(code: string) { const l = listener; listener = null; l?.(code); }
export function cancelScan() { listener = null; }
