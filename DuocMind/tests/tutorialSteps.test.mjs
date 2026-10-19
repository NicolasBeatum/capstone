import test from 'node:test';
import assert from 'node:assert/strict';
import { TUTORIAL_STEPS } from '../src/shared/tutorial/domain/tutorialSteps.ts';

const byId = (id) => TUTORIAL_STEPS.find((step) => step.id === id);

test('los seis pasos siguen el orden de la spec 0.2.0', () => {
  assert.equal(TUTORIAL_STEPS.length, 6);
  assert.deepEqual(
    TUTORIAL_STEPS.map((step) => step.id),
    ['inicio', 'agenda', 'eventos', 'bienestar', 'registro', 'cierre'],
  );
  assert.deepEqual(
    TUTORIAL_STEPS.map((step) => step.target),
    ['weekCard', 'agenda', 'events', 'wellness', 'checkin', null],
  );
});

test('el check-in es el quinto paso y «Todo listo» el último', () => {
  assert.equal(TUTORIAL_STEPS[4].kind, 'checkin');
  assert.equal(TUTORIAL_STEPS[4].target, 'checkin');
  assert.equal(TUTORIAL_STEPS[5].kind, 'closing');
  assert.equal(TUTORIAL_STEPS[5].target, null);
  assert.equal(TUTORIAL_STEPS[5].title, 'Todo listo');
});

test('solo hay un paso de check-in, uno de cierre y el resto informa', () => {
  const kinds = TUTORIAL_STEPS.map((step) => step.kind);
  assert.equal(kinds.filter((kind) => kind === 'checkin').length, 1);
  assert.equal(kinds.filter((kind) => kind === 'closing').length, 1);
  assert.deepEqual(kinds.slice(0, 4), ['info', 'info', 'info', 'info']);
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

test('el paso del check-in deja la emoción bajo control de la persona', () => {
  const { body } = byId('registro');
  assert.match(body, /Tú eliges qué emoción registrar/);
  assert.match(body, /corregirla/);
  assert.match(body, /ahora o más tarde/);
});

test('el paso del check-in no sugiere una emoción ni lo presenta como obligatorio', () => {
  const { title, body } = byId('registro');
  const suggestion = /\b(feliz|triste|bien|mal|contento|ansios|enojad|estresad|deprimid|calma)/i;
  const mandatory = /\b(debes|tienes que|es obligatorio|obligatori|necesitas registrar|para continuar|para poder)/i;
  assert.doesNotMatch(`${title} ${body}`, suggestion);
  assert.doesNotMatch(`${title} ${body}`, mandatory);
});

test('el paso de bienestar distingue la orientación de la ayuda profesional', () => {
  assert.match(byId('bienestar').body, /no reemplaza la atención de un profesional/);
});

test('«sin conexión» solo se afirma en el paso de bienestar y de los teléfonos', () => {
  const offline = TUTORIAL_STEPS.filter((step) => /sin conexión/i.test(step.body));
  assert.deepEqual(offline.map((step) => step.id), ['bienestar']);
  assert.match(offline[0].body, /teléfonos de apoyo que se ven incluso sin conexión/);
});

test('el cierre indica dónde volver a ver el tutorial y el paso del check-in no', () => {
  assert.match(byId('cierre').body, /Ver tutorial de la app/);
  assert.doesNotMatch(byId('registro').body, /Ver tutorial de la app/);
});
