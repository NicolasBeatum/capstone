import { database, fixtures } from "./runtime.mjs";
const [name, action] = process.argv.slice(2);
if (
  !["staff", "dual"].includes(name) || !["enable", "revoke"].includes(action)
) throw Error("Uso local: staff.mjs staff|dual enable|revoke");
const db = await database();
try {
  await db.query(
    "insert into private.admin_staff(auth_user_id,enabled) values($1,$2) on conflict(auth_user_id) do update set enabled=excluded.enabled",
    [fixtures()[name].id, action === "enable"],
  );
  console.log("Autorización de fixture local actualizada.");
} finally {
  await db.end();
}
