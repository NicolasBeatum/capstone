import type {
  EmotionDashboard,
  EmotionPeriod,
  FormOptions,
  EventType,
  InstitutionalEvent,
  MutationResult,
  StudentPage,
  TestCatalog,
  TestVersion,
} from "../domain/types";
type Obj = Record<string, unknown>;
function bad(): never {
  throw Error("Respuesta del servidor inválida.");
}
function obj(v: unknown): Obj {
  return v && typeof v === "object" && !Array.isArray(v) ? v as Obj : bad();
}
function str(v: unknown): string {
  return typeof v === "string" ? v : bad();
}
function nullable(v: unknown): string | null {
  return v === null ? null : str(v);
}
function num(v: unknown): number {
  return typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : bad();
}
function positive(v: unknown): number {
  const value = num(v);
  return value > 0 ? value : bad();
}
function instant(v: unknown): string {
  const value = str(v);
  return Number.isFinite(Date.parse(value)) ? value : bad();
}
function bool(v: unknown): boolean {
  return typeof v === "boolean" ? v : bad();
}
function list<T>(v: unknown, parse: (v: unknown, index: number) => T): T[] {
  return Array.isArray(v) ? v.map((item, index) => parse(item, index)) : bad();
}
function id(v: unknown): string {
  const s = str(v);
  return /^[1-9][0-9]*$/.test(s) && BigInt(s) <= 9223372036854775807n
    ? s
    : bad();
}
function uuid(v: unknown): string {
  const s = str(v);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      s,
    )
    ? s
    : bad();
}
function status(v: unknown): "draft" | "published" {
  return v === "draft" || v === "published" ? v : bad();
}
function kind(v: unknown): "protected" | "custom" {
  return v === "protected" || v === "custom" ? v : bad();
}
function summary(v: unknown) {
  const o = obj(v);
  return {
    versionId: id(o.versionId),
    version: positive(o.version),
    title: str(o.title),
    publicationStatus: status(o.publicationStatus),
    active: bool(o.active),
    revision: positive(o.revision),
  };
}
export function students(v: unknown): StudentPage {
  const o = obj(v);
  return {
    items: list(o.items, (v) => {
      const s = obj(v);
      if (
        Object.keys(s).sort().join() !==
          ["career", "email", "id", "name"].join()
      ) bad();
      return {
        id: id(s.id),
        name: str(s.name),
        email: nullable(s.email),
        career: nullable(s.career),
      };
    }),
    total: num(o.total),
    page: positive(o.page),
    pageSize: positive(o.pageSize),
  };
}
export function catalog(v: unknown): TestCatalog {
  const o = obj(v);
  return {
    catalogId: uuid(o.catalogId),
    code: str(o.code),
    kind: kind(o.kind),
    activeVersionId: o.activeVersionId === null ? null : id(o.activeVersionId),
    versions: list(o.versions, summary),
  };
}
export function catalogs(v: unknown) {
  return list(v, catalog);
}
export function version(v: unknown): TestVersion {
  const o = obj(v);
  return {
    ...summary(o),
    catalogId: uuid(o.catalogId),
    kind: kind(o.kind),
    code: str(o.code),
    scoringKind: str(o.scoringKind),
    publishedAt: nullable(o.publishedAt),
    description: str(o.description),
    questions: list(o.questions, (v) => {
      const q = obj(v);
      return {
        text: str(q.text),
        helper: str(q.helper),
        critical: bool(q.critical),
        options: list(q.options, (v) => {
          const o = obj(v);
          return { text: str(o.text), score: num(o.score) };
        }),
      };
    }),
    levels: list(o.levels, (v) => {
      const l = obj(v);
      return {
        key: str(l.key),
        label: str(l.label),
        content: str(l.content),
        min: num(l.min),
        max: num(l.max),
      };
    }),
  };
}
function eventTypeId(v: unknown): string {
  const value = str(v);
  return /^[1-9][0-9]{0,4}$/.test(value) && Number(value) <= 32767 ? value : bad();
}
export function eventTypes(v: unknown): EventType[] {
  const parsed = list(v, (value) => {
    const o = obj(value);
    if (Object.keys(o).sort().join() !== ["code", "id", "name", "order", "revision"].join()) bad();
    const code = str(o.code), name = str(o.name), order = num(o.order);
    if (!/^[a-z][a-z0-9_]{1,31}$/.test(code) || !name.trim() || name !== name.trim() || name.length > 40 || order > 32767) bad();
    return { id: eventTypeId(o.id), code, name, order, revision: positive(o.revision) };
  });
  if (new Set(parsed.map(t => t.id)).size !== parsed.length || new Set(parsed.map(t => t.code)).size !== parsed.length) bad();
  return parsed;
}
export function events(v: unknown): InstitutionalEvent[] {
  return list(v, (v) => {
    const o = obj(v);
    if (
      o.status !== "draft" && o.status !== "published" &&
      o.status !== "cancelled"
    ) bad();
    return {
      id: uuid(o.id),
      typeId: o.typeId === null ? null : eventTypeId(o.typeId),
      title: str(o.title),
      description: str(o.description),
      location: str(o.location),
      startsAt: instant(o.startsAt),
      endsAt: instant(o.endsAt),
      requiresRegistration: bool(o.requiresRegistration),
      registrationUrl: o.registrationUrl === null ? null : str(o.registrationUrl),
      registrationDeadline: o.registrationDeadline === null ? null : instant(o.registrationDeadline),
      registrationClosed: bool(o.registrationClosed),
      status: o.status,
      publishedAt: nullable(o.publishedAt),
      revision: positive(o.revision),
    };
  });
}
export function options(v: unknown): FormOptions {
  const o = obj(v);
  return {
    careers: list(o.careers, (v) => {
      const c = obj(v);
      return { id: id(c.id), name: str(c.name) };
    }),
    moods: list(o.moods, str),
    resultLevels: list(o.resultLevels, (v) => {
      const l = obj(v);
      return {
        catalogId: uuid(l.catalogId),
        versionId: id(l.versionId),
        version: positive(l.version),
        title: str(l.title),
        level: str(l.level),
        label: str(l.label),
        active: bool(l.active),
      };
    }),
  };
}
export function mutation(v: unknown): MutationResult {
  const o = obj(v);
  if (
    !("versionId" in o) && !("id" in o) || num(o.revision) < 1 ||
    "versionId" in o && !("catalogId" in o)
  ) bad();
  return {
    revision: positive(o.revision),
    ...("id" in o
      ? { id: /^[0-9a-f-]{36}$/i.test(str(o.id)) ? uuid(o.id) : id(o.id) }
      : {}),
    ...("versionId" in o ? { versionId: id(o.versionId) } : {}),
    ...("catalogId" in o ? { catalogId: uuid(o.catalogId) } : {}),
  };
}
export function access(v: unknown) {
  const o = obj(v);
  if (o.allowed !== true) bad();
  list(o.capabilities, str);
  return true;
}
export function accepted(v: unknown) {
  if (obj(v).accepted !== true) bad();
  return true;
}

// Dashboard emocional: validación estricta. Cualquier clave desconocida (por ejemplo un
// identificador de estudiante) invalida toda la respuesta para que nunca llegue a la pantalla.
function exact<T extends Obj>(v: unknown, keys: string[]): T {
  const o = obj(v);
  if (Object.keys(o).sort().join() !== [...keys].sort().join()) bad();
  return o as T;
}
function day(v: unknown): string {
  const s = str(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s + "T00:00:00Z")) ? s : bad();
}
function mean(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) && v >= 1 && v <= 5 ? v : bad();
}
export function emotions(v: unknown): EmotionDashboard {
  const o = exact(v, [
    "average", "careers", "checkins", "days", "distribution", "from",
    "minGroupSize", "participants", "sufficient", "to", "weekly",
  ]);
  if (o.days !== 7 && o.days !== 30 && o.days !== 90) bad();
  const days = o.days as EmotionPeriod;
  const minGroupSize = positive(o.minGroupSize);
  const sufficient = bool(o.sufficient);
  const from = day(o.from), to = day(o.to);
  if (from > to) bad();
  if (!sufficient) {
    if (
      o.participants !== null || o.checkins !== null || o.average !== null ||
      !Array.isArray(o.distribution) || o.distribution.length ||
      !Array.isArray(o.weekly) || o.weekly.length ||
      !Array.isArray(o.careers) || o.careers.length
    ) bad();
    return {
      days, from, to, minGroupSize, sufficient,
      participants: null, checkins: null, average: null,
      distribution: [], weekly: [], careers: [],
    };
  }
  const participants = num(o.participants);
  const checkins = num(o.checkins);
  if (participants < minGroupSize || checkins < participants) bad();
  const distribution = list(o.distribution, (item, index) => {
    const d = exact<Obj>(item, ["checkins", "label", "value"]);
    if (d.value !== index + 1) bad();
    return { value: index + 1, label: str(d.label), checkins: num(d.checkins) };
  });
  if (distribution.length !== 5) bad();
  const weekly = list(o.weekly, (item) => {
    const w = exact<Obj>(item, ["average", "participants", "weekStart"]);
    if ((w.participants === null) !== (w.average === null)) bad();
    if (w.participants === null) {
      return { weekStart: day(w.weekStart), participants: null, average: null };
    }
    const count = num(w.participants);
    if (count < minGroupSize) bad();
    return { weekStart: day(w.weekStart), participants: count, average: mean(w.average) };
  });
  const careers = list(o.careers, (item) => {
    const c = exact<Obj>(item, ["average", "name", "participants"]);
    const count = num(c.participants);
    if (count < minGroupSize) bad();
    return { name: str(c.name), participants: count, average: mean(c.average) };
  });
  return {
    days, from, to, minGroupSize, sufficient,
    participants, checkins, average: mean(o.average),
    distribution, weekly, careers,
  };
}
