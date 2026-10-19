import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { authClient, database, localDir } from "./runtime.mjs";
const admin = authClient(true);
const db = await database();
try {
  const accounts = {};
  for (const name of ["staff", "student", "unassigned", "dual"]) {
    const email = `${name}@duocmind.example.test`;
    const password = crypto.randomBytes(24).toString("base64url");
    const listed = await admin.auth.admin.listUsers();
    if (listed.error) {
      throw new Error("No se pudo listar fixtures Auth locales.");
    }
    const existing = listed.data.users.find((u) => u.email === email);
    const response = existing
      ? await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      })
      : await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (response.error || !response.data.user) {
      throw new Error("No se pudo preparar la fixture Auth local.");
    }
    accounts[name] = { id: response.data.user.id, email, password };
  }
  const campus = (await db.query(
    "insert into public.sede(nombre_sede) values('Sede sintética') on conflict(nombre_sede) do update set nombre_sede=excluded.nombre_sede returning id_sede",
  )).rows[0].id_sede;
  const career = (await db.query(
    "insert into public.carrera(nombre_carrera,sede_id_sede) values('Carrera sintética',$1) on conflict(sede_id_sede,nombre_carrera) do update set nombre_carrera=excluded.nombre_carrera returning id_carrera",
    [campus],
  )).rows[0].id_carrera;
  for (const name of ["student", "dual"]) {
    const a = accounts[name];
    const row = (await db.query(
      "insert into public.estudiante(auth_user_id,rut,primer_nombre,primer_apellido,correo) values($1,$2,$3,$4,$5) on conflict(auth_user_id) do update set correo=excluded.correo returning id_estudiante",
      [
        a.id,
        `FIXTURE-${name}`,
        "Alumno",
        name,
        `perfil-${name}@duocmind.example.test`,
      ],
    )).rows[0];
    a.studentId = row.id_estudiante;
    await db.query(
      "insert into public.estudiante_carrera(estudiante_id_estudiante,carrera_id_carrera) select $1,$2 where not exists(select 1 from public.estudiante_carrera where estudiante_id_estudiante=$1 and fecha_fin is null)",
      [a.studentId, career],
    );
  }
  const unlinked = (await db.query(
    "insert into public.estudiante(rut,primer_nombre,primer_apellido,correo,auth_user_id) values('FIXTURE-unlinked','Cuenta','Desvinculada','antiguo@duocmind.example.test',null) on conflict(rut) do update set auth_user_id=null returning id_estudiante",
  )).rows[0];
  accounts.unlinked = { studentId: unlinked.id_estudiante };
  fs.writeFileSync(
    path.join(localDir, "fixtures.json"),
    JSON.stringify(accounts),
    { mode: 0o600 },
  );
  for (const name of ["staff", "student", "unassigned", "dual"]) {
    const a = accounts[name];
    const c = authClient();
    const sign = await c.auth.signInWithPassword({
      email: a.email,
      password: a.password,
    });
    assert(!sign.error && sign.data.session);
    await c.auth.signOut();
  }
  assert.equal(
    (await db.query(
      "select count(*)::int n from public.estudiante where auth_user_id=$1",
      [accounts.staff.id],
    )).rows[0].n,
    0,
  );
  console.log(
    "Fixtures sintéticas preparadas y autenticación verificada; credenciales solo en archivo local ignorado.",
  );
} finally {
  await db.end();
}
