import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSubjects, subjectOptions } from '../src/shared/subjects/domain/subject.ts';

const subject = (id, name, code) => ({ id, name, code });

test('ordena las opciones por nombre y guarda el nombre como valor', () => {
  const options = subjectOptions([
    subject('3', 'Programación web', 'PGY3121'),
    subject('1', 'Base de datos', 'BDY2101'),
    subject('2', 'Ética profesional', 'EPY1101'),
  ]);
  assert.deepEqual(options.map((o) => o.label), ['Base de datos', 'Ética profesional', 'Programación web']);
  assert.deepEqual(options.map((o) => o.value), ['Base de datos', 'Ética profesional', 'Programación web']);
});

test('agrega el código solo cuando dos asignaturas comparten nombre', () => {
  const options = subjectOptions([
    subject('1', 'Inglés', 'ING101'),
    subject('2', 'Inglés', 'ING202'),
    subject('3', 'Matemática', 'MAT101'),
  ]);
  assert.deepEqual(options.map((o) => o.label), ['Inglés (ING101)', 'Inglés (ING202)', 'Matemática']);
});

test('acepta una lista vacía', () => {
  assert.deepEqual(parseSubjects([]), []);
  assert.deepEqual(subjectOptions([]), []);
});

test('rechaza datos que no son una lista válida de asignaturas', () => {
  for (const bad of [null, {}, 'x', [null], [{ id: '', name: 'A', code: 'C' }], [{ id: '1', name: '', code: 'C' }],
    [{ id: '1', name: 'A', code: '' }], [{ id: 1, name: 'A', code: 'C' }], [{ id: '1', name: 'x'.repeat(121), code: 'C' }],
    Array.from({ length: 101 }, (_, i) => subject(String(i), `A${i}`, `C${i}`))]) {
    assert.throws(() => parseSubjects(bad));
  }
});

test('descarta duplicados por id y recorta espacios', () => {
  const parsed = parseSubjects([subject('1', ' Base de datos ', ' BDY '), subject('1', 'Otra', 'X')]);
  assert.deepEqual(parsed, [subject('1', 'Base de datos', 'BDY')]);
});
