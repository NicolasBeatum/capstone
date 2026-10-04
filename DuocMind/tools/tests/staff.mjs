import assert from "node:assert/strict";
import { database, fixtures } from "../scripts/runtime.mjs";
const db = await database();
const f = fixtures();
try {
  await db.query("begin");
  await db.query("delete from private.admin_staff where auth_user_id=$1", [
    f.staff.id,
  ]);
  await db.query("insert into private.admin_staff(auth_user_id) values($1)", [
    f.staff.id,
  ]);
  assert.equal(
    (await db.query(
      "select enabled from private.admin_staff where auth_user_id=$1",
      [f.staff.id],
    )).rows[0].enabled,
    false,
  );
  for (
    const [sql, args, code] of [
      [
        "insert into private.admin_staff(auth_user_id) values($1)",
        [f.staff.id],
        "23505",
      ],
      ["insert into private.admin_staff(auth_user_id) values($1)", [
        "00000000-0000-0000-0000-000000000001",
      ], "23503"],
    ]
  ) {
    await db.query("savepoint negative");
    await assert.rejects(db.query(sql, args), (e) => e.code === code);
    await db.query("rollback to savepoint negative");
  }
  await db.query("savepoint negative");
  await db.query("set local role authenticated");
  await assert.rejects(
    db.query(
      "insert into private.admin_staff(auth_user_id,enabled) values($1,true)",
      [f.student.id],
    ),
    (e) => e.code === "42501",
  );
  await db.query("rollback to savepoint negative");
  assert.equal(
    (await db.query(
      "select count(*)::int n from private.admin_staff where auth_user_id=$1",
      [f.student.id],
    )).rows[0].n,
    0,
  );
  await db.query("delete from auth.users where id=$1", [f.staff.id]);
  assert.equal(
    (await db.query(
      "select count(*)::int n from private.admin_staff where auth_user_id=$1",
      [f.staff.id],
    )).rows[0].n,
    0,
  );
  await db.query("rollback");
  console.log(
    "T004: valores iniciales, duplicados, FK, autoasignación y cascada verificados.",
  );
} finally {
  await db.end();
}
