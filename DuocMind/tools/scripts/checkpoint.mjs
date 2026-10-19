import fs from "node:fs";
const [id, evidence] = process.argv.slice(2);
if (!/^T\d{3}$/.test(id) || !evidence) throw Error("ID y evidencia requeridos");
const base = new URL("../../specs/005-admin-dashboard/", import.meta.url);
const tasks = new URL("tasks.md", base);
fs.writeFileSync(
  tasks,
  fs.readFileSync(tasks, "utf8").replace(`- [ ] ${id} `, `- [x] ${id} `),
);
fs.appendFileSync(
  new URL("verification.md", base),
  `\n## ${id} — revisión 0.2.0\n\n${evidence}\n`,
);
