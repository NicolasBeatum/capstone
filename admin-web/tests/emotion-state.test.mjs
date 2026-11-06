import test from "node:test";
import assert from "node:assert/strict";
import { emotionState } from "../src/domain/emotionState.ts";

const scale = ["Muy mal", "Mal", "Neutro", "Bien", "Muy bien"].map((label, i) => ({
  value: i + 1,
  label,
  checkins: 0,
}));

test("un promedio toma el estado más cercano de la escala", () => {
  assert.equal(emotionState(3.3, scale), "Neutro");
  assert.equal(emotionState(3.9, scale), "Bien");
  assert.equal(emotionState(1, scale), "Muy mal");
  assert.equal(emotionState(5, scale), "Muy bien");
});

test("el punto medio entre dos estados sube al superior", () => {
  assert.equal(emotionState(3.5, scale), "Bien");
  assert.equal(emotionState(2.5, scale), "Neutro");
});

test("sin escala no inventa un estado", () => {
  assert.equal(emotionState(3, []), "");
});
