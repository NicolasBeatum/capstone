import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPdfText } from '../src/features/agenda/domain/pdfText.ts';
import {
  DuocTimetableError,
  MAX_TIMETABLE_BYTES,
  parseDuocTimetable,
  readableName,
} from '../src/features/agenda/domain/duocTimetable.ts';
import {
  cell,
  FAKE_RUT,
  FAKE_STUDENT,
  pdfFromTexts,
  sampleTimetable,
  timetableTexts,
} from './fixtures/duocTimetable.mjs';

const block = (b) => `${b.weekday} ${b.startsAt}-${b.endsAt} ${b.subjectKey} ${b.room}`;
const expectError = (code) => (error) => {
  assert.ok(error instanceof DuocTimetableError);
  assert.equal(error.code, code);
  return true;
};
const onePage = (rows, options = {}) => pdfFromTexts(timetableTexts({ pages: [{ rows }], ...options }));

test('extractPdfText devuelve textos con acentos y posición desde arriba', () => {
  const texts = extractPdfText(pdfFromTexts([[[85.9, 591.75, 'Miércoles'], [17, 591.75, 'Módulo']]]));
  assert.deepEqual(texts, [
    { page: 0, x: 85.9, y: 791 - 591.75, text: 'Miércoles' },
    { page: 0, x: 17, y: 791 - 591.75, text: 'Módulo' },
  ]);
});

test('extractPdfText numera las páginas y no lee flujos comprimidos', () => {
  const pages = extractPdfText(pdfFromTexts([[[1, 700, 'uno']], [[1, 700, 'dos']]]));
  assert.deepEqual(pages.map((t) => [t.page, t.text]), [[0, 'uno'], [1, 'dos']]);
  assert.deepEqual(extractPdfText(pdfFromTexts([[[1, 700, 'x']]], { compress: true })), []);
  assert.deepEqual(extractPdfText(new Uint8Array()), []);
});

test('lee el semestre, los ramos y los bloques del boletín', () => {
  const result = parseDuocTimetable(sampleTimetable());
  assert.equal(result.semesterName, '2.º semestre 2025');
  assert.deepEqual(result.subjects.map((s) => [s.key, s.name]), [
    ['GPY6111-004D', 'Gestión de Proyectos Informáticos'],
    ['MLY0100-001D', 'Machine Learning'],
    ['APY6461-004D', 'Proceso de Portafolio 6'],
    ['ASY6131-004D', 'Seguridad en Sistemas Computacionales'],
    ['TAL1234-001D', 'Taller Sabatino'],
  ]);
  assert.deepEqual(result.blocks.map(block), [
    '1 10:41-12:10 ASY6131-004D W608',
    '2 10:01-11:20 GPY6111-004D W609',
    '3 16:41-18:10 ASY6131-004D W608',
    '4 17:31-18:10 MLY0100-001D W608',
    '4 18:31-19:10 MLY0100-001D W608',
    '6 16:01-16:40 TAL1234-001D Y101',
  ]);
});

test('une clave partida y celda cortada entre páginas', () => {
  const result = parseDuocTimetable(sampleTimetable());
  // El miércoles la celda de 16:41 termina («W608») en la página siguiente.
  assert.ok(result.blocks.some((b) => b.weekday === 3 && b.room === 'W608' && b.startsAt === '16:41'));
});

test('une módulos con recreo de hasta 15 minutos y separa los demás', () => {
  const key = cell('BASE DE DATOS', 'BDY1234-001D/PM-W101');
  const result = parseDuocTimetable(onePage([
    { start: '08:31', end: '09:10', cells: { 1: key } },
    { start: '09:25', end: '10:05', cells: { 1: key } },
    { start: '10:21', end: '11:00', cells: { 1: key } },
  ]));
  assert.deepEqual(result.blocks.map(block), [
    '1 08:31-10:05 BDY1234-001D W101',
    '1 10:21-11:00 BDY1234-001D W101',
  ]);
});

test('un ramo en dos salas es un solo ramo con bloques separados', () => {
  const result = parseDuocTimetable(onePage([
    { start: '15:11', end: '15:50', cells: { 3: cell('INGLÉS', 'ESP1513-002D/PM-W607'), 4: cell('INGLÉS', 'ESP1513-002D/PM-Y303') } },
    { start: '16:01', end: '16:40', cells: { 3: cell('INGLÉS', 'ESP1513-002D/PM-W607'), 4: cell('INGLÉS', 'ESP1513-002D/PM-W608') } },
  ]));
  assert.equal(result.subjects.length, 1);
  assert.deepEqual(result.blocks.map(block), [
    '3 15:11-16:40 ESP1513-002D W607',
    '4 15:11-15:50 ESP1513-002D Y303',
    '4 16:01-16:40 ESP1513-002D W608',
  ]);
});

test('las asignaturas con detalle son clases puntuales y no bloques', () => {
  const result = parseDuocTimetable(sampleTimetable());
  assert.ok(!result.blocks.some((b) => b.subjectKey === 'APY6461-004D'));
  assert.deepEqual(result.sessions, [
    { subjectKey: 'APY6461-004D', date: '2025-08-25', startsAt: '16:01', endsAt: '17:20', room: 'VIRTUAL01' },
    { subjectKey: 'APY6461-004D', date: '2025-09-22', startsAt: '16:01', endsAt: '17:20', room: 'VIRTUAL01' },
  ]);
});

test('una asignatura solo en el detalle usa la sala del detalle', () => {
  const result = parseDuocTimetable(onePage(
    [{ start: '08:31', end: '09:10', cells: { 1: cell('ARQUITECTURA', 'ASY4131-001D/PM-W607') } }],
    {
      term: '1er Sem.',
      year: '2026',
      details: [{
        key: 'APY4461-APY4461-004D-PROCESO DE PORTAFOLIO 4',
        classes: [{ date: ['Viernes 27 de', 'Septiembre de 2026'], time: '10:41 a 11:20', room: ['PM-Y307 SALA DE CLASES', '(42)'] }],
      }],
    },
  ));
  assert.equal(result.semesterName, '1.er semestre 2026');
  assert.deepEqual(result.sessions, [
    { subjectKey: 'APY4461-004D', date: '2026-09-27', startsAt: '10:41', endsAt: '11:20', room: 'PM-Y307 SALA DE CLASES' },
  ]);
  assert.ok(result.subjects.some((s) => s.key === 'APY4461-004D' && s.name === 'Proceso de Portafolio 4'));
});

test('el resultado no contiene nombre, RUT ni carrera', () => {
  const json = JSON.stringify(parseDuocTimetable(sampleTimetable()));
  for (const value of [FAKE_STUDENT, FAKE_RUT, 'PRUEBA', 'INFORMÁTICA', 'Informática']) {
    assert.ok(!json.includes(value), value);
  }
});

test('rechaza archivos que no son boletines sin mostrar su contenido', () => {
  const secret = 'TEXTO PRIVADO 12345678-9';
  const cases = [
    [new Uint8Array([1, 2, 3]), 'unreadable'],
    [pdfFromTexts([[[1, 700, secret]]], { compress: true }), 'unreadable'],
    [pdfFromTexts([[[1, 700, secret]]]), 'not_timetable'],
    [onePage([{ start: '08:31', end: '09:10', cells: { 1: [secret] } }]), 'not_timetable'],
    [onePage([]), 'not_timetable'],
  ];
  for (const [bytes, code] of cases) {
    assert.throws(() => parseDuocTimetable(bytes), (error) => {
      expectError(code)(error);
      assert.ok(!error.message.includes('PRIVADO'));
      return true;
    });
  }
});

test('rechaza archivos de más de 2 MB antes de leerlos', () => {
  assert.throws(() => parseDuocTimetable(new Uint8Array(MAX_TIMETABLE_BYTES + 1)), expectError('too_large'));
});

test('readableName respeta conectores y números romanos', () => {
  assert.equal(readableName('ÉTICA PARA EL TRABAJO'), 'Ética para el Trabajo');
  assert.equal(readableName('INGLÉS INTERMEDIO II'), 'Inglés Intermedio II');
  assert.equal(readableName('DE LA TEORÍA A LA PRÁCTICA'), 'De la Teoría a la Práctica');
});
