import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIRST_STEP,
  backAction,
  isLastStep,
  nextStep,
  positionLabel,
  previousStep,
} from '../src/shared/tutorial/domain/tutorialFlow.ts';

test('avanza paso a paso y se detiene en el último', () => {
  assert.equal(nextStep(FIRST_STEP, 6), 1);
  assert.equal(nextStep(4, 6), 5);
  assert.equal(nextStep(5, 6), 5);
});

test('retrocede paso a paso y se detiene en el primero', () => {
  assert.equal(previousStep(5), 4);
  assert.equal(previousStep(1), 0);
  assert.equal(previousStep(0), 0);
});

test('solo el último paso es el último', () => {
  assert.equal(isLastStep(4, 6), false);
  assert.equal(isLastStep(5, 6), true);
});

test('la posición cuenta desde uno', () => {
  assert.equal(positionLabel(0, 6), 'Paso 1 de 6');
  assert.equal(positionLabel(1, 6), 'Paso 2 de 6');
  assert.equal(positionLabel(5, 6), 'Paso 6 de 6');
});

test('Atrás del sistema retrocede y en el primer paso omite el recorrido', () => {
  assert.equal(backAction(0), 'skip');
  assert.equal(backAction(1), 'previous');
  assert.equal(backAction(5), 'previous');
});

test('recorrer todos los pasos con Siguiente termina en el último', () => {
  let index = FIRST_STEP;
  const visited = [index];
  while (!isLastStep(index, 6)) {
    index = nextStep(index, 6);
    visited.push(index);
  }
  assert.deepEqual(visited, [0, 1, 2, 3, 4, 5]);
});
