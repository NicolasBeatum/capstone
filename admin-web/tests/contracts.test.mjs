import test from "node:test";
import assert from "node:assert/strict";
import {
  catalog,
  emotions,
  events,
  eventTypes,
  mutation,
  students,
} from "../src/infrastructure/contracts.ts";
const student = {
  id: "9007199254740993",
  name: "Fixture",
  email: null,
  career: null,
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
  // La sede fue eliminada del esquema: una respuesta que la incluya no coincide con el contrato.
  assert.throws(() =>
    students({
      items: [{ ...student, campus: "Puerto Montt" }],
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
  const e={typeId:null,id:'00000000-0000-0000-0000-000000000001',title:'Taller',description:'',location:'Patio',startsAt:'2030-10-12T12:00:00Z',endsAt:'2030-10-12T14:30:00Z',status:'published',publishedAt:'2026-10-11T12:00:00Z',revision:1,requiresRegistration:true,registrationUrl:'https://example.com/form',registrationDeadline:'2030-10-11T12:00:00Z',registrationClosed:false};
  assert.equal(events([e])[0].requiresRegistration,true);
  assert.throws(()=>events([{...e,requiresRegistration:'true'}]));
  assert.throws(()=>events([{...e,registrationDeadline:'ayer'}]));
});


test("catálogo de tipos y referencias de eventos validan límites e identidad", () => {
  const type = {id:"1",code:"charla",name:"Charla",order:0,revision:1};
  assert.deepEqual(eventTypes([type]),[type]);
  for (const change of [{id:1},{id:"01"},{id:"32768"},{name:" "},{name:" Charla"},{name:"x".repeat(41)},{code:"A"},{order:-1},{order:32768},{revision:0},{extra:true}]) {
    assert.throws(()=>eventTypes([{...type,...change}]));
  }
  assert.throws(()=>eventTypes([type,type]));
  const event={id:"00000000-0000-0000-0000-000000000001",typeId:"1",title:"Taller",description:"",location:"Patio",startsAt:"2030-10-12T12:00:00Z",endsAt:"2030-10-12T14:30:00Z",status:"draft",publishedAt:null,revision:1,requiresRegistration:false,registrationUrl:null,registrationDeadline:null,registrationClosed:false};
  assert.equal(events([event])[0].typeId,"1");
  assert.equal(events([{...event,typeId:null}])[0].typeId,null);
  for (const typeId of [undefined,1,"01","32768",{}]) assert.throws(()=>events([{...event,typeId}]));
});

test("dashboard emocional: contrato estricto, sin identificadores y sin valores parciales", () => {
  const sufficient = {
    days: 30, from: "2026-10-08", to: "2026-11-06", minGroupSize: 5, sufficient: true,
    participants: 12, checkins: 58, average: 3.4,
    distribution: [1, 2, 3, 4, 5].map((value) => ({ value, label: "Nivel " + value, checkins: value })),
    weekly: [
      { weekStart: "2026-10-05", participants: 7, average: 3.2 },
      { weekStart: "2026-10-12", participants: null, average: null },
    ],
    careers: [{ name: "Otras carreras", participants: 6, average: 3.5 }],
  };
  const insufficient = {
    days: 7, from: "2026-10-31", to: "2026-11-06", minGroupSize: 5, sufficient: false,
    participants: null, checkins: null, average: null, distribution: [], weekly: [], careers: [],
  };
  assert.equal(emotions(sufficient).participants, 12);
  assert.equal(emotions(sufficient).weekly[1].average, null);
  assert.equal(emotions(insufficient).sufficient, false);
  // Una clave extra en cualquier nivel invalida toda la respuesta.
  assert.throws(() => emotions({ ...sufficient, studentId: "42" }));
  assert.throws(() => emotions({ ...sufficient, careers: [{ ...sufficient.careers[0], studentId: "42" }] }));
  assert.throws(() => emotions({ ...sufficient, weekly: [{ ...sufficient.weekly[0], email: "a@b.c" }] }));
  assert.throws(() => emotions({ ...sufficient, distribution: [{ ...sufficient.distribution[0], id: "1" }, ...sufficient.distribution.slice(1)] }));
  // Estado insuficiente con valores parciales, periodo ajeno o grupos bajo el mínimo.
  assert.throws(() => emotions({ ...insufficient, participants: 3 }));
  assert.throws(() => emotions({ ...insufficient, careers: sufficient.careers }));
  assert.throws(() => emotions({ ...sufficient, days: 15 }));
  assert.throws(() => emotions({ ...sufficient, careers: [{ name: "X", participants: 3, average: 3 }] }));
  assert.throws(() => emotions({ ...sufficient, weekly: [{ weekStart: "2026-10-05", participants: 2, average: 3 }] }));
  assert.throws(() => emotions({ ...sufficient, weekly: [{ weekStart: "2026-10-05", participants: 7, average: null }] }));
  assert.throws(() => emotions({ ...sufficient, distribution: sufficient.distribution.slice(1) }));
});
