import test from "node:test";
import assert from "node:assert/strict";
import { previewResult, validatePublication } from "../src/domain/testRules.ts";
const content = {
  title: "Fixture",
  description: "",
  questions: [{
    text: "Fixture",
    helper: "",
    options: [{ text: "A", score: 2 }, { text: "B", score: 4 }],
  }, {
    text: "Otra",
    helper: "",
    options: [{ text: "A", score: 0 }, { text: "B", score: 1 }],
  }],
  levels: [{
    key: "general",
    label: "General",
    content: "Orientación",
    min: 2,
    max: 5,
  }],
};
test("rangos cubren sumas mínimas/máximas; huecos y solapamientos se rechazan", () => {
  assert.equal(validatePublication(content), null);
  assert(
    validatePublication({
      ...content,
      levels: [{ ...content.levels[0], min: 0 }],
    }),
  );
  assert(
    validatePublication({
      ...content,
      levels: [{ ...content.levels[0], max: 3 }, {
        ...content.levels[0],
        key: "otro",
        min: 3,
        max: 5,
      }],
    }),
  );
});
test("vista previa exige todas las respuestas y selecciona límites inclusivos", () => {
  assert.equal(previewResult(content, { 0: 2 }), null);
  assert.equal(previewResult(content, { 0: 4, 1: 1 }).score, 5);
  assert.equal(previewResult(content, { 0: 2, 1: 0 }).level.key, "general");
});
