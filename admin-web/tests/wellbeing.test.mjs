import test from "node:test";
import assert from "node:assert/strict";
import {
  decimal,
  delta,
  moodLabel,
  percent,
  percentCeiling,
  shortDate,
  slugOf,
  tabFromSlug,
} from "../src/domain/wellbeing.ts";

test("el promedio toma el estado más cercano de la escala", () => {
  assert.equal(moodLabel(3.3), "Neutro");
  assert.equal(moodLabel(3.5), "Bien");
  assert.equal(moodLabel(2.5), "Neutro");
  assert.equal(moodLabel(1), "Muy mal");
  assert.equal(moodLabel(5), "Muy bien");
});

test("formatos en español de Chile", () => {
  assert.equal(decimal(3), "3,0");
  assert.equal(decimal(3.25), "3,3");
  assert.equal(percent(27), "27 %");
  assert.equal(percent(27.3), "27,3 %");
  assert.equal(shortDate("2026-11-09"), "9 nov");
});

test("variación: dirección, tono y unidad", () => {
  assert.deepEqual(delta({ value: 12, previous: 10 }, { higherIsBetter: true }), {
    text: "2",
    direction: "up",
    tone: "good",
  });
  assert.deepEqual(delta({ value: 31, previous: 25.5 }, { higherIsBetter: false, unit: "points" }), {
    text: "5,5 pts",
    direction: "up",
    tone: "bad",
  });
  assert.deepEqual(delta({ value: 3.0, previous: 3.2 }, { higherIsBetter: true, unit: "decimal" }), {
    text: "0,2",
    direction: "down",
    tone: "bad",
  });
  assert.equal(delta({ value: 96, previous: 96 }, { higherIsBetter: null }).text, "sin cambio");
  assert.equal(delta({ value: 96, previous: 90 }, { higherIsBetter: null }).tone, "neutral");
});

test("sin valor o sin periodo anterior no hay variación", () => {
  assert.equal(delta({ value: null, previous: 10 }, { higherIsBetter: true }), null);
  assert.equal(delta({ value: 10, previous: null }, { higherIsBetter: true }), null);
});

test("pestañas en la URL", () => {
  assert.equal(tabFromSlug("motivos"), "reasons");
  assert.equal(tabFromSlug(undefined), "summary");
  assert.equal(tabFromSlug("otra"), "summary");
  assert.equal(slugOf("participation"), "participacion");
});

test("eje de porcentajes con tope redondo", () => {
  assert.equal(percentCeiling([12, null, 18]), 20);
  assert.equal(percentCeiling([41]), 60);
  assert.equal(percentCeiling([100]), 100);
  assert.equal(percentCeiling([null]), 20);
});
