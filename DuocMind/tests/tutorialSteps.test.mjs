import test from 'node:test';
import assert from 'node:assert/strict';
import { TUTORIAL_STEPS } from '../src/shared/tutorial/domain/tutorialSteps.ts';

test('los seis pasos siguen el orden de la spec', () => {
  assert.deepEqual(
    TUTORIAL_STEPS.map((step) => step.target),
    ['weekCard', 'checkin', 'agenda', 'events', 'wellness', null],
  );
  assert.equal(TUTORIAL_STEPS.length, 6);
});

test('ids y elementos resaltados no se repiten', () => {
  const ids = TUTORIAL_STEPS.map((step) => step.id);
  assert.equal(new Set(ids).size, ids.length);
  const targets = TUTORIAL_STEPS.map((step) => step.target).filter((target) => target !== null);
  assert.equal(new Set(targets).size, targets.length);
});

test('cada paso tiene título y texto, y solo el cierre no resalta nada', () => {
  for (const step of TUTORIAL_STEPS) {
    assert.ok(step.title.trim().length > 0, `${step.id}: título vacío`);
    assert.ok(step.body.trim().length > 0, `${step.id}: texto vacío`);
  }
  const withoutTarget = TUTORIAL_STEPS.filter((step) => step.target === null);
  assert.deepEqual(withoutTarget.map((step) => step.id), ['cierre']);
});

test('el texto es no clínico: sin diagnóstico, tratamiento ni terapia', () => {
  const clinical = /diagn[oó]stic|tratamient|terapi|trastorno|curar|medicaci[oó]n/i;
  for (const step of TUTORIAL_STEPS) {
    assert.doesNotMatch(`${step.title} ${step.body}`, clinical, step.id);
  }
});

test('el paso de registro deja la emoción bajo control de la persona', () => {
  const step = TUTORIAL_STEPS.find((item) => item.id === 'registro');
  assert.match(step.body, /corregirla/);
});

test('el paso de bienestar distingue la orientación de la ayuda profesional', () => {
  const step = TUTORIAL_STEPS.find((item) => item.id === 'bienestar');
  assert.match(step.body, /no reemplaza la atención de un profesional/);
});

test('«sin conexión» solo se afirma en el paso de bienestar y de los teléfonos', () => {
  const offline = TUTORIAL_STEPS.filter((step) => /sin conexión/i.test(step.body));
  assert.deepEqual(offline.map((step) => step.id), ['bienestar']);
  assert.match(offline[0].body, /teléfonos de apoyo que se ven incluso sin conexión/);
});

test('el cierre indica dónde volver a ver el tutorial', () => {
  const step = TUTORIAL_STEPS.at(-1);
  assert.match(step.body, /Ver tutorial de la app/);
});
