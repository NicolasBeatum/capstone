import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MOOD_PALETTE,
  broteParams,
  mixColors,
  moodColorAt,
  potColorAt,
} from '../src/shared/components/broteParams.ts';

test('matches the specified values at each of the five states', () => {
  const expected = [
    { t: 0, stemHeight: 34, leafAngle: -58, potColor: '#dbbd73' },
    { t: 0.25, stemHeight: 50, leafAngle: 2, potColor: '#dbbd73' },
    { t: 0.5, stemHeight: 66, leafAngle: -25, potColor: '#f6d57e' },
    { t: 0.75, stemHeight: 78, leafAngle: -35, potColor: '#f6d57e' },
    { t: 1, stemHeight: 88, leafAngle: -35, potColor: '#f6d57e' },
  ];
  for (const { t, potColor, ...numbers } of expected) {
    const params = broteParams(t);
    for (const [key, value] of Object.entries(numbers)) assert.equal(params[key], value, `${key} en t=${t}`);
    assert.equal(params.potColor, potColor);
  }
});

test('interpolates linearly between neighbouring states', () => {
  assert.equal(broteParams(0.125).stemHeight, 42);
  assert.equal(broteParams(0.375).stemHeight, 58);
  assert.equal(broteParams(0.625).leafAngle, -30);
});

test('clamps t outside the 0 to 1 range', () => {
  assert.deepEqual(broteParams(-3), broteParams(0));
  assert.deepEqual(broteParams(7), broteParams(1));
});

test('a t that is not a number draws Normal and never produces NaN', () => {
  assert.deepEqual(broteParams(NaN), broteParams(0.5));
  const { face, stemHeight, leafAngle, scene } = broteParams(NaN);
  for (const value of [...Object.values(face), stemHeight, leafAngle, scene.circle]) {
    assert.equal(Number.isNaN(value), false);
  }
});

test('opens the flower only between t=0.75 and t=1, with sparkles only at the top', () => {
  assert.equal(broteParams(0.75).flower, 0);
  assert.equal(broteParams(0.875).flower, 0.5);
  assert.equal(broteParams(1).flower, 1);
  assert.equal(broteParams(0.5).sparkle, 0);
  assert.equal(broteParams(1).sparkle, 1);
});

test('keeps a green bud until normal and a pink bud when good', () => {
  assert.equal(broteParams(0).budColor, '#8cc48a');
  assert.equal(broteParams(0.5).budColor, '#8cc48a');
  assert.equal(broteParams(0.75).budColor, '#f7a8a0');
});

test('never wilts: stem upright, leaves never drooping, mouth always smiling', () => {
  for (let step = 0; step <= 100; step += 1) {
    const params = broteParams(step / 100);
    assert.ok(params.leafAngle <= 5, `hoja caída en t=${step / 100}`);
    assert.ok(params.face.mouthCurve > 0, `boca seria o triste en t=${step / 100}`);
    assert.equal('stemCurve' in params, false);
    assert.equal('dryLeaf' in params, false);
    assert.equal('tear' in params.face, false);
    assert.equal('sadEyes' in params.face, false);
  }
});

test('draws the right face details for each state', () => {
  const at = (t) => broteParams(t).face;
  // Muy mal no cierra los ojos: podría leerse como burla.
  assert.equal(at(0).dotEyes, 1);
  assert.equal(at(0).happyEyes, 0);
  assert.equal(at(0).blush, 1);
  assert.equal(at(0.25).dotEyes, 1);
  assert.equal(at(0.25).blush, 1);
  assert.equal(at(0.5).dotEyes, 1);
  assert.equal(at(0.5).blush, 0.4);
  assert.equal(at(0.75).blush, 1);
  assert.equal(at(1).happyEyes, 1);
  assert.equal(at(1).mouthOpen, 1);
  assert.equal(at(0.5).mouthCurve, 5);
  assert.ok(at(0).mouthCurve > 0 && at(1).mouthCurve > at(0).mouthCurve);
});

test('draws a purple circle when low, none at normal and a green one when good', () => {
  const scene = (t) => broteParams(t).scene;
  assert.equal(scene(0).circle, 1);
  assert.equal(scene(0).moon, 1);
  assert.equal(scene(0).cloud, 0);
  assert.equal(scene(0.25).circle, 1);
  assert.equal(scene(0.25).moon, 0);
  assert.equal(scene(0.25).cloud, 1);
  assert.equal(scene(0.5).circle, 0);
  assert.equal(scene(0.5).cloud, 0);
  assert.equal(scene(0.75).circle, 1);
  assert.equal(scene(1).circle, 1);
  // Sin luna ni nubes en los estados buenos: solo el círculo verde.
  assert.equal(scene(0.75).moon + scene(0.75).cloud, 0);
  assert.equal(scene(1).moon + scene(1).cloud, 0);
  assert.equal(scene(0).tint, mixColors(MOOD_PALETTE['Muy mal'], '#ffffff', 0.6));
  assert.equal(scene(1).tint, mixColors(MOOD_PALETTE['Muy bien'], '#ffffff', 0.6));
});

test('keeps the pot yellow, only shaded a little when low', () => {
  assert.equal(potColorAt(0.5), '#f6d57e');
  assert.equal(potColorAt(1), '#f6d57e');
  assert.equal(potColorAt(0), potColorAt(0.25));
  assert.notEqual(potColorAt(0), potColorAt(0.5));
  assert.equal(potColorAt(0.375), '#e8c978');
});

test('blends colors and keeps the bar color in step with the pot', () => {
  assert.equal(mixColors('#000000', '#ffffff', 0.5), '#808080');
  assert.equal(moodColorAt(0), '#8b80b1');
  assert.equal(moodColorAt(1), '#5bb07f');
  assert.notEqual(moodColorAt(0.6), moodColorAt(0.5));
});

test('uses the weekly chart palette, purple to green', () => {
  assert.deepEqual(MOOD_PALETTE, {
    'Muy mal': '#8b80b1',
    'Mal': '#a99fcf',
    'Neutro': '#cfc8b9',
    'Bien': '#9fcaa8',
    'Muy bien': '#5bb07f',
  });
  assert.equal(moodColorAt(0.25), MOOD_PALETTE.Mal);
  assert.equal(moodColorAt(0.75), MOOD_PALETTE.Bien);
});
