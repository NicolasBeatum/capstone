import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activityFormSemester,
  changeActivityType,
  prepareActivityForm,
} from '../src/shared/planner/application/activityForm.ts';
import { emptySchedule, putSemester, putSubject } from '../src/shared/planner/domain/schedule.ts';
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const first = { id: id(1), name: 'Anterior', startsOn: null, endsOn: null },
  active = { id: id(2), name: 'Activo', startsOn: null, endsOn: null };
let schedule = putSemester(putSemester(emptySchedule(), active), first);
schedule = putSubject(
  putSubject(schedule, {
    id: id(3),
    semesterId: active.id,
    name: 'Programación',
    code: null,
    section: null,
  }),
  {
    id: id(4),
    semesterId: first.id,
    name: 'Ramo anterior',
    code: null,
    section: null,
  },
);
const personal = {
  id: id(5),
  kind: 'personal',
  title: 'Estudiar',
  date: '2026-10-19',
  time: '09:00',
  subjectName: null,
  semesterId: null,
  semesterName: null,
  version: 1,
};
test('personal se guarda general sin ramo o con ramo opcional del activo', () => {
  assert.deepEqual(prepareActivityForm(personal, schedule), personal);
  const related = prepareActivityForm({
    ...personal,
    subjectName: 'Programación',
  }, schedule);
  assert.equal(related.subjectName, 'Programación');
  assert.equal(related.semesterId, null);
  assert.throws(() => prepareActivityForm({ ...personal, subjectName: 'Ramo anterior' }, schedule));
  assert.equal(prepareActivityForm(personal, emptySchedule()).semesterId, null);
});
test('pruebas y tareas se asocian al activo y exigen un ramo de él', () => {
  for (const kind of ['exam', 'task']) {
    const form = changeActivityType(personal, kind, schedule);
    assert.equal(form.semesterId, active.id);
    assert.throws(() => prepareActivityForm(form, schedule));
    assert.throws(() => prepareActivityForm({ ...form, subjectName: 'Ramo anterior' }, schedule));
    const saved = prepareActivityForm(
      { ...form, subjectName: 'Programación' },
      schedule,
    );
    assert.equal(saved.semesterName, 'Activo');
    assert.equal(saved.subjectName, 'Programación');
  }
  assert.throws(() =>
    prepareActivityForm({
      ...personal,
      kind: 'exam',
      subjectName: 'Programación',
    }, emptySchedule())
  );
});
test('cambio de tipo conserva un ramo compatible, pero personal no queda ligada al semestre', () => {
  const exam = changeActivityType(
    { ...personal, subjectName: 'Programación' },
    'exam',
    schedule,
  );
  assert.equal(exam.subjectName, 'Programación');
  assert.equal(exam.semesterId, active.id);
  const next = changeActivityType(exam, 'personal', schedule);
  assert.equal(next.subjectName, 'Programación');
  assert.equal(next.semesterId, null);
  const unrelated = changeActivityType(
    { ...exam, subjectName: 'Ramo anterior' },
    'personal',
    schedule,
  );
  assert.equal(unrelated.subjectName, null);
});
test('cambiar de activo con el formulario abierto no reasigna silenciosamente una prueba', () => {
  const exam = changeActivityType(
    { ...personal, subjectName: 'Programación' },
    'exam',
    schedule,
  );
  assert.throws(
    () => prepareActivityForm(exam, { ...schedule, activeSemesterId: first.id }),
    /Cambió el semestre activo/,
  );
});
test('editar conserva semestre y nombre histórico de pruebas aunque el ramo ya no exista', () => {
  const previous = {
    ...personal,
    kind: 'exam',
    semesterId: first.id,
    semesterName: 'Nombre histórico',
    subjectName: 'Ramo eliminado',
  };
  assert.equal(
    activityFormSemester(schedule, previous).name,
    'Nombre histórico',
  );
  const saved = prepareActivityForm(
    { ...previous, title: 'Título editado' },
    schedule,
    previous,
  );
  assert.equal(saved.semesterId, first.id);
  assert.equal(saved.subjectName, 'Ramo eliminado');
});
test('personal trasladada conserva su organización explícita y puede quitar su ramo', () => {
  const previous = {
    ...personal,
    semesterId: first.id,
    semesterName: 'Anterior',
    subjectName: 'Ramo guardado',
  };
  assert.equal(
    prepareActivityForm(previous, schedule, previous).subjectName,
    'Ramo guardado',
  );
  assert.equal(
    prepareActivityForm({ ...previous, subjectName: null }, schedule, previous)
      .semesterId,
    first.id,
  );
});
