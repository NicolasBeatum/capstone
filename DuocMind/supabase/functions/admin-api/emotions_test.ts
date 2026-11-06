import { HttpError, validateReadQuery } from "./validation.ts";

const status = (path: string, query: Record<string, string>) => {
  try {
    validateReadQuery(path, query);
    return 200;
  } catch (e) {
    return e instanceof HttpError ? e.status : -1;
  }
};

Deno.test("emotions: days admite solo 7, 30 y 90 y ningún otro campo", () => {
  for (
    const q of <Record<string, string>[]> [{}, { days: "7" }, { days: "30" }, {
      days: "90",
    }]
  ) {
    if (status("/emotions", q) !== 200) throw new Error(JSON.stringify(q));
  }
  for (
    const q of <Record<string, string>[]> [
      { days: "15" },
      { days: "" },
      { days: "07" },
      { days: "30", extra: "1" },
      { extra: "1" },
    ]
  ) {
    if (status("/emotions", q) !== 422) throw new Error(JSON.stringify(q));
  }
});

Deno.test("emotions: otras rutas no se alteran", () => {
  if (status("/students", { search: "a" }) !== 200) throw new Error("students");
});
