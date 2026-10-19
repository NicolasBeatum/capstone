import fs from "node:fs";
import crypto from "node:crypto";
const files = [["who5", "who5"], ["phq9", "phq9"], ["gad7", "gad7"], [
  "sondeoInicial",
  "sondeoInicial",
]];
const instruments = [];
for (const [file, exportName] of files) {
  const source = new URL(
    `../src/features/emotional-checkin/data/${file}.ts`,
    import.meta.url,
  );
  const instrument = (await import(source.href))[exportName];
  const max = instrument.score({}).maxScore;
  const levels = [];
  for (let raw = 0; raw <= max; raw++) {
    let remaining = raw;
    const answers = {};
    for (const q of instrument.questions) {
      const options = q.options ?? instrument.options;
      const v = Math.min(remaining, Math.max(...options.map((o) => o.value)));
      answers[q.id] = v;
      remaining -= v;
    }
    const r = instrument.score(answers);
    const prev = levels.at(-1);
    if (prev?.key === r.category) prev.max = raw;
    else {levels.push({
        key: r.category,
        label: r.categoryLabel,
        content: instrument.interpretation[r.category] ?? "",
        min: raw,
        max: raw,
      });}
  }
  instruments.push({
    code: instrument.id === "sondeoInicial" ? "sondeo" : instrument.id,
    title: instrument.name,
    scoringKind: instrument.id,
    sourceHash: crypto.createHash("sha256").update(fs.readFileSync(source))
      .digest("hex"),
    max,
    questions: instrument.questions.map((q) => ({
      text: q.title,
      helper: q.helper ?? "",
      critical: q.isCritica ?? false,
      options: (q.options ?? instrument.options).map((o) => ({
        text: o.label,
        score: o.value,
      })),
    })),
    levels,
  });
}
const manifest = {
  schemaVersion: 1,
  instruments,
  pss10: {
    code: "pss10",
    title: "Escala de Estrés Percibido (PSS-10)",
    source:
      "Esquema existente; no hay seed validado en el repositorio. No se sintetiza su contenido.",
  },
};
fs.writeFileSync(
  new URL("../supabase/manifests/protected-tests.json", import.meta.url),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  "Manifiesto derivado de definiciones actuales; PSS-10 se conserva sin contenido inventado.",
);
