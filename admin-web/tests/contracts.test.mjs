import test from "node:test";
import assert from "node:assert/strict";
import {
  careersAvailable,
  catalog,
  emotions,
  events,
  eventTypes,
  mutation,
  students,
  wellbeingCareers,
  wellbeingParticipation,
  wellbeingReasons,
  wellbeingStress,
  wellbeingSummary,
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

// Dashboard de bienestar (spec 023).
const header = { days: 30, from: "2026-10-17", to: "2026-11-15", minGroupSize: 5, careerId: null, sufficient: true };
const k = (value, previous = null) => ({ value, previous });
const summary = {
  ...header,
  participants: k(45, 42), checkins: k(683, 683), average: k(3, 3.2), difficultShare: k(31, 25.3),
  testTaken: k(36, 27), highStressShare: k(null, null),
  weekly: [{ weekStart: "2026-10-12", average: 2.9, distribution: [9.9, 34.9, 31.6, 19.1, 4.5] },
    { weekStart: "2026-10-19", average: null, distribution: [null, null, null, null, null] }],
  weekdays: [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, average: day === 7 ? null : 3 })),
  topReasons: [{ name: "Académico", share: 22.8 }],
};
const insufficient = (extra) => ({ ...header, sufficient: false, ...extra });

test("bienestar: resumen válido y vacío", () => {
  const r = wellbeingSummary(summary);
  assert.equal(r.participants.value, 45);
  assert.equal(r.weekly[1].distribution[0], null, "null se conserva, nunca 0");
  const none = { participants: k(null), checkins: k(null), average: k(null), difficultShare: k(null), testTaken: k(null), highStressShare: k(null), weekly: [], weekdays: [], topReasons: [] };
  assert.equal(wellbeingSummary(insufficient(none)).sufficient, false);
  assert.throws(() => wellbeingSummary(insufficient({ ...none, weekly: summary.weekly })), "insuficiente con datos");
});

test("bienestar: claves de más, ids o valores fuera de rango invalidan la respuesta", () => {
  assert.throws(() => wellbeingSummary({ ...summary, studentId: "1" }));
  assert.throws(() => wellbeingSummary({ ...summary, topReasons: [{ name: "x", share: 1, sid: 9 }] }));
  assert.throws(() => wellbeingSummary({ ...summary, participants: k(4) }), "menos de 5 estudiantes");
  assert.throws(() => wellbeingSummary({ ...summary, average: k(6) }));
  assert.throws(() => wellbeingSummary({ ...summary, difficultShare: k(101) }));
  assert.throws(() => wellbeingSummary({ ...summary, participants: k(null, 40) }), "variación sin valor actual");
  assert.throws(() => wellbeingSummary({ ...summary, weekly: [{ weekStart: "2026-10-12", average: 3, distribution: [1, 2, 3] }] }));
  assert.throws(() => wellbeingSummary({ ...summary, careerId: "abc" }));
  assert.throws(() => wellbeingSummary({ ...summary, days: 15 }));
});

test("bienestar: motivos, estrés, carreras y participación", () => {
  const reasons = wellbeingReasons({
    ...header,
    ranking: [{ name: "Académico", share: 42.9, average: 2 }],
    matrix: [{ name: "Académico", cells: [0, 100, 0, 0, 0] }, { name: "Otros motivos", cells: [null, null, null, null, null] }],
    trend: [{ name: "Académico", weeks: [{ weekStart: "2026-10-12", share: null }] }],
  });
  assert.equal(reasons.matrix[1].cells[2], null);
  assert.throws(() => wellbeingReasons({ ...reasons, matrix: [{ name: "x", cells: [1, 2, 3, 4] }] }));

  const stress = {
    ...header, participants: k(11), average: k(17.7), highShare: k(45.5),
    levels: [{ level: "leve", label: "Estrés leve", students: null }, { level: "severo", label: "Estrés severo", students: 6 }],
    weekly: [{ weekStart: "2026-10-12", average: 17.7, highShare: 45.5 }],
    careers: [{ name: "Otras carreras", average: null, highShare: null }],
  };
  assert.equal(wellbeingStress(stress).levels[1].students, 6);
  assert.throws(() => wellbeingStress({ ...stress, levels: [{ level: "leve", label: "x", students: 3 }] }), "nivel con 3 estudiantes");
  assert.throws(() => wellbeingStress({ ...stress, average: k(41) }));

  const careers = { ...header, rows: [{ name: "Otras carreras", participants: 8, average: 4.4, difficultShare: 0, highStressShare: null, topReason: null }] };
  assert.equal(wellbeingCareers(careers).rows[0].topReason, null);
  assert.throws(() => wellbeingCareers({ ...careers, rows: [{ ...careers.rows[0], participants: 3 }] }));

  const participation = {
    ...header, registered: 64, sharingShare: 60.9, active: k(39, 35), checkinsPerParticipant: k(50.4),
    weekly: [{ weekStart: "2026-10-12", active: 37 }, { weekStart: "2026-10-19", active: null }],
  };
  assert.equal(wellbeingParticipation(participation).weekly[1].active, null);
  assert.throws(() => wellbeingParticipation({ ...participation, weekly: [{ weekStart: "2026-10-12", active: 2 }] }));
});

test("bienestar: selector de carreras", () => {
  const available = { days: 30, from: "2026-10-17", to: "2026-11-15", minGroupSize: 5, careerId: null, sufficient: true, careers: [{ id: "114", name: "Contabilidad" }] };
  assert.deepEqual(careersAvailable(available), [{ id: "114", name: "Contabilidad" }]);
  assert.throws(() => careersAvailable({ ...available, careers: [{ id: "114", name: "x", participants: 9 }] }));
});
