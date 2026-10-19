import test from "node:test";
import assert from "node:assert/strict";
import {
  localToInstant,
  possibleInstants,
  santiagoInput,
} from "../src/domain/eventTime.ts";
test("Santiago: fecha normal se convierte a UTC y vuelve", () => {
  assert.equal(localToInstant("2026-10-04T10:00"), "2026-10-04T13:00:00.000Z");
  assert.equal(santiagoInput("2026-10-04T13:00:00.000Z"), "2026-10-04T10:00");
});
test("horas inexistentes y calendario inválido se rechazan", () => {
  assert.throws(() => localToInstant("2026-09-06T00:30"));
  assert.throws(() => localToInstant("2026-02-30T12:00"));
});
test("hora repetida requiere elección explícita del instante", () => {
  const candidates = possibleInstants("2026-04-04T23:30");
  assert.equal(candidates.length, 2);
  assert.throws(() => localToInstant("2026-04-04T23:30"));
  assert.equal(
    localToInstant("2026-04-04T23:30", candidates[1]),
    candidates[1],
  );
});
