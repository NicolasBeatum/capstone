import assert from "node:assert/strict";
import { validateMutation } from "./validation.ts";
const requestId = "00000000-0000-0000-0000-000000000001";
const type = { requestId, code: "feria", name: "  Feria  ", order: 0 };
Deno.test("tipos: normaliza nombre, limita código/orden y protege código al editar", () => {
  assert.equal(
    validateMutation("POST", "/event-types", { ...type }).name,
    "Feria",
  );
  validateMutation("PUT", "/event-types/1", {
    requestId,
    expectedRevision: 1,
    name: "Feria",
    order: 32767,
  });
  for (
    const change of [
      { code: "A" },
      { code: "x" },
      { code: "x".repeat(33) },
      { name: " " },
      { name: "x".repeat(41) },
      { order: -1 },
      { order: 32768 },
      { order: 1.5 },
      { order: "1" },
      { actor: "fake" },
    ]
  ) {
    assert.throws(() =>
      validateMutation("POST", "/event-types", { ...type, ...change })
    );
  }
  assert.throws(() =>
    validateMutation("PUT", "/event-types/1", { ...type, expectedRevision: 1 })
  );
  assert.throws(() =>
    validateMutation("PUT", "/event-types/32768", {
      requestId,
      expectedRevision: 1,
      name: "Feria",
      order: 1,
    })
  );
});
Deno.test("eventos: referencia nullable/omitida compatible e ID estricto", () => {
  const event = {
    requestId,
    title: "Feria",
    description: "",
    location: "Local",
    startsAt: "2030-10-12T12:00:00Z",
    endsAt: "2030-10-12T13:00:00Z",
  };
  for (const value of [undefined, null, "1", "32767"]) {
    const result = validateMutation("POST", "/events", {
      ...event,
      ...(value === undefined ? {} : { typeId: value }),
    });
    assert.equal(result.typeId, value);
  }
  for (const typeId of [1, "01", "0", "32768", {}, true]) {
    assert.throws(() =>
      validateMutation("POST", "/events", { ...event, typeId })
    );
  }
});
