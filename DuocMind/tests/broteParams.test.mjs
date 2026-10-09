import assert from 'node:assert/strict';
import test from 'node:test';

import { broteParams, mixColors, moodColorAt } from '../src/shared/components/broteParams.ts';

test('matches the specified values at each of the five states', () => {
  const expected = [
    { t: 0, stemHeight: 36, stemCurve: 42, leafAngle: 40, potColor: '#c9bbe6' },
    { t: 0.25, stemHeight: 52, stemCurve: 16, leafAngle: 15, potColor: '#c8d7ee' },
    { t: 0.5, stemHeight: 66, stemCurve: 0, leafAngle: -25, potColor: '#e8dfcc' },
    { t: 0.75, stemHeight: 78, stemCurve: 0, leafAngle: -35, potColor: '#f6d57e' },
    { t: 1, stemHeight: 88, stemCurve: 0, leafAngle: -35, potColor: '#f2b45c' },
  ];
  for (const { t, potColor, ...numbers } of expected) {
    const params = broteParams(t);
    for (const [key, value] of Object.entries(numbers)) assert.equal(params[key], value, `${key} en t=${t}`);
    assert.equal(params.potColor, potColor);
  }
});

test('interpolates linearly between neighbouring states', () => {
  assert.equal(broteParams(0.125).stemHeight, 44);
  assert.equal(broteParams(0.375).stemHeight, 59);
  assert.equal(broteParams(0.125).stemCurve, 29);
  assert.equal(broteParams(0.625).leafAngle, -30);
});

test('clamps t outside the 0 to 1 range', () => {
  assert.deepEqual(broteParams(-3), broteParams(0));
  assert.deepEqual(broteParams(7), broteParams(1));
});

test('opens the flower only between t=0.75 and t=1, with sparkles only at the top', () => {
  assert.equal(broteParams(0.75).flower, 0);
  assert.equal(broteParams(0.875).flower, 0.5);
  assert.equal(broteParams(1).flower, 1);
  assert.equal(broteParams(0.5).sparkle, 0);
  assert.equal(broteParams(1).sparkle, 1);
});

test('shows a dry leaf when low, a green bud at normal and a pink bud when good', () => {
  assert.equal(broteParams(0).dryLeaf, 1);
  assert.equal(broteParams(0.25).dryLeaf, 1);
  assert.equal(broteParams(0.5).dryLeaf, 0);
  assert.equal(broteParams(0.5).budColor, '#8cc48a');
  assert.equal(broteParams(0.75).budColor, '#f7a8a0');
});

test('draws the right face details for each state', () => {
  const at = (t) => broteParams(t).face;
  assert.equal(at(0).sadEyes, 1);
  assert.equal(at(0).tear, 1);
  assert.equal(at(0.25).brows, 1);
  assert.equal(at(0.25).tear, 0);
  assert.equal(at(0.5).dotEyes, 1);
  assert.equal(at(0.5).blush, 0);
  assert.equal(at(0.75).blush, 1);
  assert.equal(at(1).happyEyes, 1);
  assert.equal(at(1).mouthOpen, 1);
  assert.ok(at(0).mouthCurve < 0 && at(1).mouthCurve > 0);
});

test('blends colors and keeps the bar color in step with the pot', () => {
  assert.equal(mixColors('#000000', '#ffffff', 0.5), '#808080');
  assert.equal(moodColorAt(0), '#c9bbe6');
  assert.equal(moodColorAt(1), '#f2b45c');
  assert.notEqual(moodColorAt(0.6), moodColorAt(0.5));
});
