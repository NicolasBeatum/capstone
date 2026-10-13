import test from "node:test";
import assert from "node:assert/strict";
import {
  catalog,
  events,
  mutation,
  students,
} from "../src/infrastructure/contracts.ts";
const student = {
  id: "9007199254740993",
  name: "Fixture",
  email: null,
  career: null,
  campus: null,
};
test("IDs bigint no pierden precisión y datos personales extra se rechazan", () => {
  assert.equal(
    students({ items: [student], total: 1, page: 1, pageSize: 25 }).items[0].id,
    student.id,
  );
  assert.throws(() =>
    students({
      items: [{ ...student, rut: "no permitido" }],
      total: 1,
      page: 1,
      pageSize: 25,
    })
  );
  assert.throws(() =>
    students({
      items: [{ ...student, id: 9007199254740993 }],
      total: 1,
      page: 1,
      pageSize: 25,
    })
  );
});
test("contratos de mutaciones y catálogo rechazan identidad/revisión ambiguas", () => {
  assert.throws(() => mutation({ revision: 1 }));
  assert.throws(() => mutation({ id: "9007199254740993", revision: 0 }));
  assert.throws(() => mutation({ versionId: "1", revision: 1 }));
  assert.throws(() =>
    catalog({
      catalogId: "1",
      code: "fixture",
      kind: "custom",
      activeVersionId: null,
      versions: [],
    })
  );
});

test("evento administrativo conserva condiciones de inscripción y rechaza tipos inválidos", () => {
  const e={id:'00000000-0000-0000-0000-000000000001',title:'Taller',description:'',location:'Patio',startsAt:'2030-10-12T12:00:00Z',endsAt:'2030-10-12T14:30:00Z',status:'published',publishedAt:'2026-10-11T12:00:00Z',revision:1,requiresRegistration:true,registrationUrl:'https://example.com/form',registrationDeadline:'2030-10-11T12:00:00Z',registrationClosed:false};
  assert.equal(events([e])[0].requiresRegistration,true);
  assert.throws(()=>events([{...e,requiresRegistration:'true'}]));
  assert.throws(()=>events([{...e,registrationDeadline:'ayer'}]));
});
