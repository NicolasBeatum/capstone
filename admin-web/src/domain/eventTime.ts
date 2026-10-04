const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
function parts(date: Date) {
  const values = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
}
export function santiagoInput(instant: string) {
  return parts(new Date(instant)).slice(0, 16);
}
export function possibleInstants(local: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return [];
  const base = new Date(local + ":00Z");
  if (
    !Number.isFinite(base.getTime()) ||
    base.toISOString().slice(0, 16) !== local
  ) return [];
  const offsets = new Set<number>();
  for (const days of [-2, -1, 0, 1, 2]) {
    const reference = new Date(base.getTime() + days * 86400000);
    const localReference = new Date(parts(reference) + "Z");
    offsets.add(localReference.getTime() - reference.getTime());
  }
  return [...offsets].map((offset) => new Date(base.getTime() - offset)).filter(
    (candidate) => parts(candidate).slice(0, 16) === local,
  ).map((d) => d.toISOString()).sort();
}
export function localToInstant(local: string, choice = ""): string {
  const candidates = possibleInstants(local);
  if (!candidates.length) {
    throw Error(
      "La fecha u hora no existe en America/Santiago. Elige otra hora.",
    );
  }
  if (candidates.length > 1 && !candidates.includes(choice)) {
    throw Error(
      "La hora es ambigua. Elige el desfase horario para fijar el instante.",
    );
  }
  return candidates.length === 1 ? candidates[0] : choice;
}
export function santiagoDisplay(instant: string) {
  return new Date(instant).toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
export function offsetLabel(instant: string) {
  return new Date(instant).toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "shortOffset",
  });
}
