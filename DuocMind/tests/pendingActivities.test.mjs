import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countdownLabel,
  INITIAL_FILTERS,
  longDayLabel,
  projectPending,
  shortDayLabel,
} from '../src/features/agenda/domain/pendingActivities.ts';

// Sábado 2026-11-14 a las 15:00 en Chile (UTC−3 en horario de verano).
const NOW = new Date('2026-11-14T18:00:00Z');
const SEM = '00000000-0000-4000-8000-0000000000aa';
let next = 0;
const make = (date, time, fields = {}) => ({
  id: `00000000-0000-4000-8000-${String(++next).padStart(12, '0')}`,
  kind: 'task',
  date,
  time,
  title: `${date} ${time}`,
  subjectName: null,
  semesterId: null,
  semesterName: null,
  version: 1,
  ...fields,
});
const titles = (group) => group.items.map((i) => i.activity.title);

test('reparte en grupos con sus bordes y omite los vacíos', () => {
  const list = [
    make('2026-11-14', '13:59'), // terminó a las 14:59: atrasada hace 1 min
    make('2026-11-14', '14:30'), // en curso
    make('2026-11-14', '23:59'),
    make('2026-11-15', '08:00'),
    make('2026-11-21', '23:00'), // día +7
    make('2026-11-22', '00:00'), // día +8
  ];
  const { groups } = projectPending(list, NOW, INITIAL_FILTERS);
  assert.deepEqual(groups.map((g) => g.id), ['late', 'today', 'soon', 'later']);
  assert.deepEqual(groups.map((g) => g.label), ['Atrasadas', 'Hoy', 'Próximos 7 días', 'Más adelante']);
  assert.deepEqual(titles(groups[0]), ['2026-11-14 13:59']);
  assert.deepEqual(titles(groups[1]), ['2026-11-14 14:30', '2026-11-14 23:59']);
  assert.deepEqual(titles(groups[2]), ['2026-11-15 08:00', '2026-11-21 23:00']);
  assert.deepEqual(titles(groups[3]), ['2026-11-22 00:00']);
  assert.equal(projectPending([list[3]], NOW, INITIAL_FILTERS).groups.length, 1);
});

test('ordena atrasadas de la más reciente a la más antigua y el resto por fecha y hora', () => {
  const list = [
    make('2026-11-10', '09:00'),
    make('2026-11-13', '09:00'),
    make('2026-11-13', '07:00', { endTime: '12:00' }),
    make('2026-11-18', '10:00'),
    make('2026-11-16', '18:00'),
    make('2026-11-16', '09:00'),
  ];
  const [late, soon] = projectPending(list, NOW, INITIAL_FILTERS).groups;
  assert.deepEqual(titles(late), ['2026-11-13 07:00', '2026-11-13 09:00', '2026-11-10 09:00']);
  assert.deepEqual(titles(soon), ['2026-11-16 09:00', '2026-11-16 18:00', '2026-11-18 10:00']);
});

test('cuentas por tipo usan el filtro de semestre y los filtros se combinan', () => {
  const list = [
    make('2026-11-16', '09:00', { kind: 'exam', semesterId: SEM, semesterName: 'S' }),
    make('2026-11-16', '10:00', { kind: 'exam' }),
    make('2026-11-17', '10:00', { kind: 'task', semesterId: SEM, semesterName: 'S' }),
    make('2026-11-17', '11:00', { kind: 'personal', doneAt: '2026-11-14T12:00:00.000Z' }),
  ];
  const all = projectPending(list, NOW, INITIAL_FILTERS);
  assert.deepEqual(all.counts, { all: 3, exam: 2, task: 1, personal: 0 });
  const semester = projectPending(list, NOW, { kind: 'exam', semester: { kind: 'semester', id: SEM } });
  assert.deepEqual(semester.counts, { all: 2, exam: 1, task: 1, personal: 0 });
  assert.equal(semester.groups[0].items.length, 1);
  assert.equal(semester.groups[0].items[0].activity.kind, 'exam');
  const general = projectPending(list, NOW, { kind: 'all', semester: { kind: 'general' } });
  assert.deepEqual(general.counts, { all: 1, exam: 1, task: 0, personal: 0 });
  assert.equal(general.done.length, 1);
  assert.equal(projectPending(list, NOW, { ...INITIAL_FILTERS, kind: 'task' }).done.length, 0);
});

test('hechas van aparte, primero la marcada más recientemente', () => {
  const list = [
    make('2026-11-16', '09:00', { title: 'A', doneAt: '2026-11-14T10:00:00.000Z' }),
    make('2026-11-10', '09:00', { title: 'B', doneAt: '2026-11-14T11:00:00.000Z' }),
    make('2026-11-16', '10:00', { title: 'C' }),
  ];
  const result = projectPending(list, NOW, INITIAL_FILTERS);
  assert.deepEqual(result.done.map((i) => i.activity.title), ['B', 'A']);
  assert.deepEqual(result.groups.map((g) => g.id), ['soon']);
  assert.match(result.done[0].a11y, /hecha$/);
});

test('resumen en singular, plural y «Todo al día»', () => {
  const late = make('2026-11-13', '09:00'), soon = make('2026-11-16', '09:00');
  assert.equal(projectPending([late, soon, make('2026-11-14', '20:00')], NOW, INITIAL_FILTERS).summary,
    '1 atrasada · 2 en los próximos 7 días');
  assert.equal(projectPending([late, make('2026-11-12', '09:00')], NOW, INITIAL_FILTERS).summary, '2 atrasadas');
  assert.equal(projectPending([make('2026-12-30', '09:00')], NOW, INITIAL_FILTERS).summary, '1 más adelante');
  assert.equal(projectPending([], NOW, INITIAL_FILTERS).summary, 'Todo al día');
  assert.equal(
    projectPending([{ ...soon, doneAt: '2026-11-14T10:00:00.000Z' }], NOW, INITIAL_FILTERS).summary,
    'Todo al día',
  );
});

test('la semana va de lunes a domingo y es null sin actividades', () => {
  const list = [
    make('2026-11-08', '09:00'), // domingo anterior
    make('2026-11-09', '09:00', { doneAt: '2026-11-09T15:00:00.000Z' }),
    make('2026-11-12', '09:00'),
    make('2026-11-15', '23:00'),
    make('2026-11-16', '09:00'), // lunes siguiente
  ];
  assert.deepEqual(projectPending(list, NOW, INITIAL_FILTERS).week, { done: 1, total: 3 });
  assert.equal(projectPending([list[0], list[4]], NOW, INITIAL_FILTERS).week, null);
});

test('etiquetas de cuenta regresiva y de cuándo', () => {
  const label = (date, time, fields) => countdownLabel(make(date, time, fields), NOW);
  assert.equal(label('2026-11-14', '14:30'), 'Ahora');
  assert.equal(label('2026-11-14', '15:20'), 'en 20 min');
  assert.equal(label('2026-11-14', '18:30'), 'en 3 h');
  assert.equal(label('2026-11-15', '01:00'), 'mañana');
  assert.equal(label('2026-11-19', '09:00'), 'en 5 días');
  assert.equal(label('2026-11-14', '12:00'), 'hace 2 h');
  assert.equal(label('2026-11-14', '13:00', { endTime: '14:59' }), 'hace 1 min');
  assert.equal(label('2026-11-13', '23:00'), 'ayer');
  assert.equal(label('2026-11-11', '09:00'), 'hace 3 días');
  const { groups } = projectPending([make('2026-11-14', '18:30'), make('2026-11-16', '09:00')], NOW, INITIAL_FILTERS);
  assert.equal(groups[0].items[0].when, '18:30');
  assert.equal(groups[1].items[0].when, 'Lun 16');
  assert.equal(groups[1].items[0].a11y, '2026-11-16 09:00, tarea, lunes 16, en 2 días');
  assert.equal(shortDayLabel('2026-11-18'), 'Mié 18');
  assert.equal(longDayLabel('2026-11-16'), 'Lunes 16 de noviembre');
});
