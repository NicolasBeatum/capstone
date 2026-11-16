import { HttpError, validateReadQuery } from "./validation.ts";

const status = (path: string, query: Record<string, string>) => {
  try {
    validateReadQuery(path, query);
    return 200;
  } catch (e) {
    return e instanceof HttpError ? e.status : -1;
  }
};
const TABS = ["summary", "reasons", "stress", "careers", "participation"].map(
  (t) => "/wellbeing/" + t,
);

Deno.test("wellbeing: pestañas admiten days y careerId", () => {
  for (const path of TABS) {
    for (
      const q of <Record<string, string>[]> [
        {},
        { days: "7" },
        { days: "90", careerId: "12" },
        { careerId: "1" },
        { careerId: "999999999999999999" },
      ]
    ) {
      if (status(path, q) !== 200) throw new Error(path + JSON.stringify(q));
    }
    for (
      const q of <Record<string, string>[]> [
        { days: "15" },
        { days: "" },
        { days: "07" },
        { careerId: "0" },
        { careerId: "-1" },
        { careerId: "01" },
        { careerId: "1.5" },
        { careerId: "abc" },
        { careerId: "" },
        { careerId: "9999999999999999999" },
        { days: "30", extra: "1" },
      ]
    ) {
      if (status(path, q) !== 422) throw new Error(path + JSON.stringify(q));
    }
  }
});

Deno.test("wellbeing: el selector de carreras solo admite days", () => {
  const path = "/wellbeing/careers-available";
  if (status(path, { days: "30" }) !== 200) throw new Error("days");
  if (status(path, { careerId: "1" }) !== 422) throw new Error("careerId");
  if (status(path, { days: "15" }) !== 422) throw new Error("days inválido");
});

Deno.test("wellbeing: rutas desconocidas las rechaza la base, no la validación", () => {
  if (status("/wellbeing/otra", { careerId: "x" }) !== 200) {
    throw new Error("la validación no conoce la ruta");
  }
  if (status("/students", { search: "a" }) !== 200) throw new Error("students");
});
