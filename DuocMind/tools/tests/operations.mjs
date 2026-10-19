import assert from "node:assert/strict";
import crypto from "node:crypto";
import { database, fixtures } from "../scripts/runtime.mjs";
const db = await database();
try {
  const f = fixtures();
  const rid = crypto.randomUUID();
  await db.query(
    "insert into private.admin_requests(request_id,actor,action,resource,payload_hash,status,created_at,expires_at) values($1,$2,'fixture','fixture','hash','completed',now()-interval '24 hours',now())",
    [rid, f.staff.id],
  );
  assert.equal(
    (await db.query(
      "select count(*)::int n from private.admin_requests where request_id=$1 and expires_at>now()",
      [rid],
    )).rows[0].n,
    0,
  );
  const job = (await db.query(
    "select schedule,active,command from cron.job where jobname='duocmind_admin_cleanup'",
  )).rows[0];
  assert.equal(job.schedule, "*/5 * * * *");
  assert.equal(job.active, true);
  await db.query("select private.cleanup_admin_operations()");
  assert.equal(
    (await db.query(
      "select count(*)::int n from private.admin_requests where request_id=$1",
      [rid],
    )).rows[0].n,
    0,
  );
  console.log(
    "T005: vencimiento lógico, rutina de limpieza e intervalo Cron comprobados. La ejecución periódica sin tráfico se comprobará en T020.",
  );
} finally {
  await db.end();
}
