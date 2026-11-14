// Genera boletines de carga académica sintéticos con el mismo dibujo que el formulario SAP
// de Duoc: textos hexadecimales con `BT x y Td 0 Tw <hex>Tj ET`, sin comprimir. Los datos
// personales son ficticios; los boletines reales no se versionan (spec 020 §5).

const PAGE_HEIGHT = 791;
const GRID_TOP = 591.75;
const FIRST_ROW = 564.75;
const ROW_HEIGHT = 62;
const LINE = 12;
const DAY_X = [85.9, 166.1, 241.5, 322.3, 407.35, 486.7];
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const WIN_ANSI = { '€': 0x80, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '–': 0x96, '—': 0x97 };

export const FAKE_STUDENT = 'PRUEBA, PERSONA FICTICIA';
export const FAKE_RUT = '11111111-1';

function hex(text) {
  return [...text].map((char) => {
    const code = WIN_ANSI[char] ?? char.charCodeAt(0);
    if (code > 0xff) throw new Error(`Carácter fuera de WinAnsi: ${char}`);
    return code.toString(16).padStart(2, '0').toUpperCase();
  }).join('');
}

/** Divide una celda como SAP: palabras de hasta 16 caracteres y la clave partida tras «/PM-». */
export function cell(name, key) {
  const lines = [];
  for (const word of name.split(' ')) {
    const last = lines.at(-1);
    if (last && `${last} ${word}`.length <= 16) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  if (key.length <= 16) lines.push(key);
  else {
    const cut = key.indexOf('/') + 4;
    lines.push(key.slice(0, cut), key.slice(cut));
  }
  return lines;
}

function header(term, year) {
  return [
    [364.25, 764.7, 'Dirección de Docencia'],
    [364.25, 752.7, 'Fecha emisión 30.07.2025'],
    [11.35, 725, 'SEDE: PUERTO MONTT'],
    [11.35, 713, 'N°SEDE: 76'],
    [58.1, 689.55, 'BOLETIN DE CARGA ACADEMICA'],
    [284.9, 689.55, term],
    [369.95, 689.55, year],
    [58.1, 665.55, 'Alumno:'],
    [114.8, 665.55, FAKE_STUDENT],
    [284.9, 665.55, 'Rut:'],
    [341.6, 665.55, FAKE_RUT],
    [58.1, 653.55, 'Carrera:'],
    [143.15, 653.55, 'INGENIERÍA EN INFORMÁTICA'],
    [58.1, 641.55, 'Jornada:'],
    [143.15, 641.55, 'Diurno'],
    [171.5, 617.55, 'Horario de Clases'],
    [17, GRID_TOP, 'Módulo'],
    [17, GRID_TOP - LINE, 'Horario'],
    ...DAYS.map((day, i) => [DAY_X[i], GRID_TOP, day]),
  ];
}

function cellTexts(weekday, top, lines) {
  return lines.map((line, i) => {
    const x = DAY_X[weekday - 1] + Math.max(1.7, (76 - line.length * 4.8) / 2);
    return [Number(x.toFixed(2)), top - i * LINE, line];
  });
}

/**
 * Arma las páginas del boletín.
 * @param {object} options
 * @param {string} [options.term] Texto del semestre, por ejemplo «2do Sem.».
 * @param {string} [options.year]
 * @param {Array<{carry?: Record<number, string[]>, rows: Array<{start: string, end: string,
 *   cells: Record<number, string[]>}>}>} options.pages Filas por página. `carry` son las
 *   líneas finales de celdas cortadas en la página anterior, por día (1 = lunes).
 * @param {Array<{key: string, classes: Array<{date: string[], time: string, room: string[]}>}>}
 *   [options.details] Detalle de clases puntuales, dibujado al final de la última página.
 */
export function timetableTexts({ term = '2do Sem.', year = '2025', pages, details = [] }) {
  return pages.map((page, index) => {
    const texts = header(term, year);
    let top = FIRST_ROW;
    if (page.carry) {
      for (const [weekday, lines] of Object.entries(page.carry)) {
        texts.push(...cellTexts(Number(weekday), top, lines));
      }
      top -= Math.max(...Object.values(page.carry).map((lines) => lines.length)) * LINE + 15;
    }
    for (const row of page.rows) {
      texts.push([39.45, top, row.start], [49.05, top - LINE, 'A'], [39.45, top - 2 * LINE, row.end]);
      for (const [weekday, lines] of Object.entries(row.cells)) {
        texts.push(...cellTexts(Number(weekday), top, lines));
      }
      top -= ROW_HEIGHT;
    }
    if (index === pages.length - 1) {
      for (const detail of details) {
        top -= 2;
        texts.push(
          [2.85, top, 'El Detalle de las clases de la '],
          [226.05, top, 'asignatura '],
          [305.25, top, `"${detail.key}" es:`],
          [2.85, top - 2 * LINE, 'Docente: DOCENTE FICTICIO'],
          [23.55, top - 4 * LINE, 'Nro. Clase'],
          [162, top - 4 * LINE, 'Fecha'],
          [301.2, top - 4 * LINE, 'Horario'],
          [465.5, top - 4 * LINE, 'Sala'],
        );
        top -= 4 * LINE + 15;
        detail.classes.forEach((session, i) => {
          texts.push([17, top, ` Clase ${String(i + 1).padStart(2, '0')}`]);
          session.date.forEach((line, j) => texts.push([102.05, top - j * LINE, j ? line : ` ${line}`]));
          texts.push([257.95, top, ` ${session.time}`]);
          session.room.forEach((line, j) => texts.push([394.85, top - j * LINE, j ? line : ` ${line}`]));
          top -= 27;
        });
        top -= 10;
      }
    }
    return texts;
  });
}

function contentStream(texts) {
  return texts.map(([x, y, text]) =>
    `/F002 12.00 Tf 0 g BT ${x.toFixed(2)} ${y.toFixed(2)} Td 0 Tw <${hex(text)}>Tj ET`
  ).join(' ');
}

/** Ensambla un PDF con una página por arreglo de textos `[x, y, texto]`. */
export function pdfFromTexts(pages, { compress = false } = {}) {
  const objects = [];
  const add = (body) => objects.push(body) && objects.length;
  const catalog = add(null), tree = add(null);
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
  const kids = pages.map((texts) => {
    const data = compress ? 'x\u009c«­\u0001\u0000' : contentStream(texts);
    const filter = compress ? ' /Filter /FlateDecode' : '';
    const stream = add(`<< /Length ${data.length}${filter} >>\nstream\n${data}\nendstream`);
    return add(
      `<< /Type /Page /Parent ${tree} 0 R /MediaBox\r\n[0 0 609 ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F002 ${font} 0 R >> >> /Contents ${stream} 0 R >>`,
    );
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${tree} 0 R >>`;
  objects[tree - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  let out = '%PDF-1.3\n';
  const offsets = objects.map((body, i) => {
    const offset = out.length;
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Uint8Array.from(out, (char) => char.charCodeAt(0));
}

/** Boletín de ejemplo: dos páginas, una celda cortada entre ellas y una asignatura puntual. */
export function sampleTimetable(options = {}) {
  const seguridad = cell('SEGURIDAD EN SISTEMAS COMPUTACIONALES', 'ASY6131-004D/PM-W608');
  const portafolio = cell('PROCESO DE PORTAFOLIO 6', 'APY6461-004D/PM-VIRTUAL01');
  const texts = timetableTexts({
    pages: [
      {
        rows: [
          { start: '10:01', end: '10:40', cells: { 2: cell('GESTIÓN DE PROYECTOS INFORMÁTICOS', 'GPY6111-004D/PM-W609') } },
          { start: '10:41', end: '11:20', cells: { 1: seguridad, 2: cell('GESTIÓN DE PROYECTOS INFORMÁTICOS', 'GPY6111-004D/PM-W609') } },
          { start: '11:31', end: '12:10', cells: { 1: seguridad } },
          { start: '16:01', end: '16:40', cells: { 1: portafolio, 6: cell('TALLER SABATINO', 'TAL1234-001D/PM-Y101') } },
          { start: '16:41', end: '17:20', cells: { 1: portafolio.slice(0, -1), 3: seguridad.slice(0, -1) } },
        ],
      },
      {
        carry: { 1: portafolio.slice(-1), 3: seguridad.slice(-1) },
        rows: [
          { start: '17:31', end: '18:10', cells: { 3: seguridad, 4: cell('MACHINE LEARNING', 'MLY0100-001D/PM-W608') } },
          { start: '18:31', end: '19:10', cells: { 4: cell('MACHINE LEARNING', 'MLY0100-001D/PM-W608') } },
        ],
      },
    ],
    details: [{
      key: 'APY6461-APY6461-004D-PROCESO DE PORTAFOLIO 6',
      classes: [
        { date: ['Lunes 25 de Agosto', 'de 2025'], time: '16:01 a 16:40', room: ['SALA VIRTUAL 01 (50)'] },
        { date: ['Lunes 25 de Agosto', 'de 2025'], time: '16:41 a 17:20', room: ['SALA VIRTUAL 01 (50)'] },
        { date: ['Lunes 22 de', 'Septiembre de 2025'], time: '16:01 a 17:20', room: ['SALA VIRTUAL 01 (50)'] },
      ],
    }],
    ...options,
  });
  return pdfFromTexts(texts);
}
