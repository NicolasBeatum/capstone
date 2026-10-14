import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPOTLIGHT_PADDING,
  cardPlacement,
  isMeasurable,
  spotlightRect,
} from '../src/shared/tutorial/domain/tutorialLayout.ts';

const window = { width: 400, height: 800 };

test('un elemento con tamaño dentro de la ventana se puede resaltar', () => {
  assert.equal(isMeasurable({ x: 10, y: 20, width: 100, height: 50 }, window), true);
  assert.equal(isMeasurable({ x: 0, y: 0, width: 400, height: 800 }, window), true);
});

test('sin tamaño, con valores no numéricos o fuera de la ventana no se resalta', () => {
  assert.equal(isMeasurable({ x: 10, y: 20, width: 0, height: 50 }, window), false);
  assert.equal(isMeasurable({ x: 10, y: 20, width: 100, height: 0 }, window), false);
  assert.equal(isMeasurable({ x: NaN, y: 20, width: 100, height: 50 }, window), false);
  assert.equal(isMeasurable({ x: 10, y: Infinity, width: 100, height: 50 }, window), false);
  assert.equal(isMeasurable({ x: 350, y: 20, width: 100, height: 50 }, window), false);
  assert.equal(isMeasurable({ x: 10, y: 780, width: 100, height: 50 }, window), false);
  assert.equal(isMeasurable({ x: -20, y: 20, width: 100, height: 50 }, window), false);
});

test('el redondeo de un píxel en el borde no descarta el elemento', () => {
  assert.equal(isMeasurable({ x: -1, y: 0, width: 401, height: 800 }, window), true);
});

test('el resalte agrega el margen y no se sale de la ventana', () => {
  assert.deepEqual(spotlightRect({ x: 100, y: 200, width: 80, height: 40 }, window), {
    x: 100 - SPOTLIGHT_PADDING,
    y: 200 - SPOTLIGHT_PADDING,
    width: 80 + SPOTLIGHT_PADDING * 2,
    height: 40 + SPOTLIGHT_PADDING * 2,
  });
  assert.deepEqual(spotlightRect({ x: 0, y: 0, width: 400, height: 800 }, window), {
    x: 0,
    y: 0,
    width: 400,
    height: 800,
  });
});

test('la tarjeta va debajo de un elemento superior, encima de uno inferior y centrada sin elemento', () => {
  assert.equal(cardPlacement({ x: 10, y: 50, width: 100, height: 40 }, window), 'below');
  assert.equal(cardPlacement({ x: 10, y: 700, width: 100, height: 60 }, window), 'above');
  assert.equal(cardPlacement(null, window), 'center');
});
