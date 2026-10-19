import assert from "node:assert/strict";
import crypto from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { database, fixtures } from "../scripts/runtime.mjs";
const db = await database();
const rid = crypto.randomUUID();
try {
  await db.query(
    "insert into private.admin_requests(request_id,actor,action,resource,payload_hash,status,created_at,expires_at) values($1,$2,'fixture','fixture','hash','completed',now()-interval '25 hours',now()-interval '1 hour')",
    [rid, fixtures().staff.id],
  );
  const id = (await db.query(
    "select cron.schedule('duocmind_cleanup_failure_fixture','1 second','select private.fixture_missing_function()') id",
  )).rows[0].id;
  await setTimeout(4000);
  assert(
    (await db.query(
      "select count(*)::int n from cron.job_run_details where jobid=$1 and status='failed'",
      [id],
    )).rows[0].n > 0,
  );
  assert.equal(
    (await db.query(
      "select count(*)::int n from private.admin_requests where request_id=$1 and expires_at>now()",
      [rid],
    )).rows[0].n,
    0,
  );
  await db.query(
    "select cron.alter_job($1,command:='select private.cleanup_admin_operations()')",
    [id],
  );
  await setTimeout(4000);
  assert.equal(
    (await db.query(
      "select count(*)::int n from private.admin_requests where request_id=$1",
      [rid],
    )).rows[0].n,
    0,
  );
  console.log(
    "T005: Cron ejecutó sin tráfico, falló de forma controlada y limpió el atraso tras recuperar su comando.",
  );
} finally {
  await db.query(
    "select cron.unschedule(jobid) from cron.job where jobname='duocmind_cleanup_failure_fixture'",
  );
  await db.query(
    "delete from cron.job_run_details where command like '%fixture_missing_function%'",
  );
  await db.end();
}
