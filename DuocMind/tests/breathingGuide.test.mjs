import test from 'node:test';
import assert from 'node:assert/strict';
import { BREATHING_GUIDE_STEPS } from '../src/features/wellness/domain/breathingGuide.ts';

const step = (id) => BREATHING_GUIDE_STEPS.find((s) => s.id === id);

test('la guía tiene pasos con ids únicos y termina con el cierre', () => {
  const ids = BREATHING_GUIDE_STEPS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(BREATHING_GUIDE_STEPS.at(-1).kind, 'closing');
  assert.equal(BREATHING_GUIDE_STEPS.at(-1).id, 'cierre');
});

test('el paso «Sonido opcional» va antes del cierre, sin elemento destacado, y explica el soplo y el latido', () => {
  const index = BREATHING_GUIDE_STEPS.findIndex((s) => s.id === 'sonido');
  assert.equal(index, BREATHING_GUIDE_STEPS.length - 2, 'va justo antes del cierre');
  const sound = step('sonido');
  assert.equal(sound.title, 'Sonido opcional');
  assert.equal(sound.kind, 'info');
  assert.equal(sound.target, null);
  assert.match(sound.body, /soplo/i);
  assert.match(sound.body, /latido cada segundo/i);
  assert.match(sound.body, /apagarlo/i);
});

test('el texto de la guía ya no describe tonos que suben y bajan', () => {
  for (const s of BREATHING_GUIDE_STEPS) {
    assert.doesNotMatch(s.body, /\btono\b/i, `${s.id} menciona un tono`);
    assert.doesNotMatch(s.body, /campanilla/i, `${s.id} menciona una campanilla`);
  }
});

test('los pasos de las fases siguen señalando el círculo', () => {
  for (const id of ['inhala', 'aguanta', 'exhala', 'anillo']) assert.equal(step(id).target, 'breathingCircle', id);
});
