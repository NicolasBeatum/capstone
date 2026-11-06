import assert from "node:assert/strict";
import { authClient, fixtures, runtime } from "../scripts/runtime.mjs";
const f = fixtures(), r = runtime(), c = authClient();
try {
  const login = await c.auth.signInWithPassword({
    email: f.staff.email,
    password: f.staff.password,
  });
  assert(!login.error);
  const get = async (path) => {
    const response = await fetch(r.API_URL + "/functions/v1/admin-api" + path, {
      headers: {
        authorization: "Bearer " + login.data.session.access_token,
        apikey: r.ANON_KEY,
      },
    });
    assert.equal(response.status, 200);
    return response.json();
  };
  const list = await get("/students");
  const student = list.items.find((s) => s.id === f.student.studentId);
  assert.equal(student.email, f.student.email);
  assert.deepEqual(Object.keys(student).sort(), [
    "career",
    "email",
    "id",
    "name",
  ]);
  assert.equal(
    list.items.find((s) => s.id === f.unlinked.studentId).email,
    null,
  );
  assert.equal(
    (await get("/students?search=" + encodeURIComponent(f.student.email)))
      .total,
    1,
  );
  assert.equal((await get("/students?search=perfil-student")).total, 0);
  assert.equal((await get("/students?search=%25")).total, 0);
  const catalogs = await get("/tests");
  const catalog = catalogs.find((t) => t.code === "who5");
  assert.equal(typeof catalog.catalogId, "string");
  const detail = await get("/tests/catalogs/" + catalog.catalogId);
  const version = await get("/tests/versions/" + detail.versions[0].versionId);
  assert.equal(typeof version.versionId, "string");
  assert.equal(typeof version.version, "number");
  assert.equal(version.questions.length, 5);
  // Tras un reset no hay cuestionarios propios: se usa un instrumento activo cualquiera
  // (la activación es válida también en los protegidos) y el estado se restaura al final.
  const chosen = catalogs.find((t) => t.kind === "custom" && t.activeVersionId) ??
    catalogs.find((t) => t.activeVersionId);
  assert(chosen);
  const selected = chosen.versions.find((v) =>
    v.versionId === chosen.activeVersionId
  );
  const change = async (revision, active) => {
    const response = await fetch(
      r.API_URL + "/functions/v1/admin-api/tests/versions/" +
        selected.versionId + "/activation",
      {
        method: "POST",
        headers: {
          authorization: "Bearer " + login.data.session.access_token,
          apikey: r.ANON_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          expectedRevision: revision,
          active,
        }),
      },
    );
    assert.equal(response.status, 200);
    return response.json();
  };
  const off = await change(selected.revision, false);
  const options = await get("/catalogs");
  assert(
    options.resultLevels.some((l) =>
      l.versionId === selected.versionId && !l.active
    ),
  );
  await change(off.revision, true);
  // Sin sedes: el catálogo expone solo carreras (id y nombre), ánimos y niveles.
  assert.deepEqual(Object.keys(options).sort(), [
    "careers",
    "moods",
    "resultLevels",
  ]);
  assert(options.careers.every((c) =>
    Object.keys(c).sort().join() === "id,name"
  ));
  assert.equal(typeof options.resultLevels[0].versionId, "string");
  assert(options.moods.includes("Mal"));
  console.log(
    "T011: correo Auth, desvinculados, búsqueda literal, datos mínimos, UUID/bigint y niveles históricos verificados por HTTP.",
  );
} finally {
  await c.auth.signOut();
}
