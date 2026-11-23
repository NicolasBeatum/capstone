/** Un texto dibujado en el PDF, con su posición medida desde la esquina superior izquierda. */
export interface PdfText {
  page: number;
  x: number;
  y: number;
  text: string;
}

const DEFAULT_PAGE_HEIGHT = 792;
// WinAnsi coincide con Latin-1 salvo en 0x80-0x9F; estos son los signos que pueden aparecer.
const WIN_ANSI_EXTRA: Record<number, string> = {
  0x80: '€', 0x85: '…', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x96: '–', 0x97: '—',
};

function latin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    out += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return out;
}

function decodeHex(hex: string): string {
  let out = '';
  for (let i = 0; i + 1 < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    out += WIN_ANSI_EXTRA[code] ?? String.fromCharCode(code);
  }
  return out;
}

/**
 * Extrae los textos de un PDF con flujos sin comprimir dibujados como
 * `BT x y Td … <hex>Tj ET`, que es como los genera el formulario SAP del boletín de Duoc.
 * No interpreta otros operadores ni ejecuta contenido; si no encuentra textos devuelve [].
 * Las páginas se numeran según el orden de sus flujos en el archivo.
 */
export function extractPdfText(bytes: Uint8Array): PdfText[] {
  const source = latin1(bytes);
  const box = /\/MediaBox\s*\[\s*-?[\d.]+\s+-?[\d.]+\s+-?[\d.]+\s+(-?[\d.]+)\s*\]/.exec(source);
  const height = box ? Number(box[1]) : DEFAULT_PAGE_HEIGHT;
  const texts: PdfText[] = [];
  let page = 0;
  for (const stream of source.matchAll(/stream\r?\n([\s\S]*?)endstream/g)) {
    let found = false;
    for (const t of stream[1].matchAll(/BT\s+(-?[\d.]+)\s+(-?[\d.]+)\s+Td[^<>]*<([0-9A-Fa-f\s]*)>\s*Tj\s*ET/g)) {
      const text = decodeHex(t[3].replace(/\s/g, '')).replace(/\s+/g, ' ').trim();
      if (!text) continue;
      found = true;
      texts.push({ page, x: Number(t[1]), y: height - Number(t[2]), text });
    }
    if (found) page += 1;
  }
  return texts;
}
