import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampMood,
  describeFace,
  moodFromValue,
} from '../src/features/emotional-checkin/domain/moodFace.ts';

test('el valor continuo se redondea al estado guardado más cercano', () => {
  assert.equal(moodFromValue(0), 'Muy mal');
  assert.equal(moodFromValue(0.49), 'Muy mal');
  assert.equal(moodFromValue(0.5), 'Mal');
  assert.equal(moodFromValue(2), 'Neutro');
  assert.equal(moodFromValue(3.4), 'Bien');
  assert.equal(moodFromValue(4), 'Muy bien');
});

test('los valores fuera de la escala se limitan a sus extremos', () => {
  assert.equal(clampMood(-3), 0);
  assert.equal(clampMood(9), 4);
  assert.equal(moodFromValue(-1), 'Muy mal');
  assert.equal(moodFromValue(7), 'Muy bien');
});

test('el rostro neutro tiene la boca recta y sin lágrima ni rubor', () => {
  const face = describeFace(2);
  assert.equal(face.mouth, 'M 34.00 66.00 Q 50 66.00 66.00 66.00');
  assert.equal(face.tear, 0);
  assert.equal(face.blush, 0);
});

test('muy mal frunce la boca y muestra lágrima; muy bien sonríe y se sonroja', () => {
  const sad = describeFace(0);
  const happy = describeFace(4);

  // Control de la curva por encima de los extremos = ceño; por debajo = sonrisa
  const controlY = (mouth) => Number(mouth.split(' ')[5]);
  const endY = (mouth) => Number(mouth.split(' ')[2]);
  assert.ok(controlY(sad.mouth) < endY(sad.mouth));
  assert.ok(controlY(happy.mouth) > endY(happy.mouth));

  assert.equal(sad.tear, 1);
  assert.equal(sad.blush, 0);
  assert.equal(happy.blush, 1);
  assert.equal(happy.tear, 0);
  assert.ok(happy.eyeRadiusY < sad.eyeRadiusY);
});

test('la expresión cambia de forma continua entre dos estados', () => {
  const low = describeFace(1);
  const mid = describeFace(1.5);
  const high = describeFace(2);
  assert.notEqual(mid.mouth, low.mouth);
  assert.notEqual(mid.mouth, high.mouth);
  assert.notEqual(mid.fill, low.fill);
  assert.notEqual(mid.fill, high.fill);
});
