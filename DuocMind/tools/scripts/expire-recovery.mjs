import { database, fixtures } from "./runtime.mjs";
const db = await database();
try {
  await db.query(
    "update auth.users set recovery_sent_at=now()-interval '2 hours' where id=$1",
    [fixtures().unassigned.id],
  );
  console.log("Vencimiento de fixture local preparado.");
} finally {
  await db.end();
}
