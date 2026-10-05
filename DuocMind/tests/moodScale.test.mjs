import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampMoodValue,
  faceColorForValue,
  moodFromValue,
  valueFromMood,
} from '../src/features/emotional-checkin/domain/moodScale.ts';

test('maps slider positions to the nearest mood', () => {
  assert.equal(moodFromValue(0), 'Muy mal');
  assert.equal(moodFromValue(1.4), 'Mal');
  assert.equal(moodFromValue(1.6), 'Neutro');
  assert.equal(moodFromValue(4), 'Muy bien');
});

test('clamps positions outside the track', () => {
  assert.equal(clampMoodValue(-2), 0);
  assert.equal(clampMoodValue(9), 4);
  assert.equal(moodFromValue(-1), 'Muy mal');
  assert.equal(moodFromValue(7), 'Muy bien');
});

test('round-trips moods and slider positions', () => {
  assert.equal(valueFromMood('Neutro'), 2);
  assert.equal(moodFromValue(valueFromMood('Bien')), 'Bien');
});

test('blends face color between neighbouring moods', () => {
  assert.equal(faceColorForValue(0), '#e7a487');
  assert.equal(faceColorForValue(4), '#f4c13d');
  assert.match(faceColorForValue(2.5), /^#[0-9a-f]{6}$/);
  assert.notEqual(faceColorForValue(2.5), faceColorForValue(2));
});
