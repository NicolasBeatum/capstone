import type {
  CareerOption,
  EmotionDashboard,
  Kpi,
  WellbeingCareers,
  WellbeingHeader,
  WellbeingParticipation,
  WellbeingPeriod,
  WellbeingReasons,
  WellbeingStress,
  WellbeingSummary,
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

// Dashboard de bienestar (spec 023): mismas reglas estrictas. Las claves deben coincidir
// exactamente; un id de estudiante o cualquier campo de más invalida toda la respuesta.
const HEADER = ["careerId", "days", "from", "minGroupSize", "sufficient", "to"];
function ranged(min: number, max: number) {
  return (v: unknown): number =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : bad();
}
function orNull<T>(parse: (v: unknown) => T) {
  return (v: unknown): T | null => v === null ? null : parse(v);
}
const share = ranged(0, 100);
const score = ranged(0, 40);
const mood = ranged(1, 5);
function kpi(v: unknown, parse: (v: unknown) => number): Kpi {
  const k = exact<Obj>(v, ["previous", "value"]);
  const value = orNull(parse)(k.value), previous = orNull(parse)(k.previous);
  if (value === null && previous !== null) bad();
  return { value, previous };
}
function header(o: Obj): WellbeingHeader {
  if (o.days !== 7 && o.days !== 30 && o.days !== 90) bad();
  const from = day(o.from), to = day(o.to);
  if (from > to) bad();
  return {
    days: o.days as WellbeingPeriod,
    from,
    to,
    minGroupSize: positive(o.minGroupSize),
    careerId: o.careerId === null ? null : id(o.careerId),
    sufficient: bool(o.sufficient),
  };
}
/** Conteo de estudiantes publicado: nunca menos que el mínimo del grupo. */
function groupCount(min: number) {
  return (v: unknown): number => {
    const n = num(v);
    return n >= min ? n : bad();
  };
}
function weekDays<T>(v: unknown, keys: string[], parse: (w: Obj) => T): (T & { weekStart: string })[] {
  return list(v, (item) => {
    const w = exact<Obj>(item, ["weekStart", ...keys]);
    return { weekStart: day(w.weekStart), ...parse(w) };
  });
}
function empty(o: Obj, lists: string[]) {
  for (const key of lists) if (!Array.isArray(o[key]) || (o[key] as unknown[]).length) bad();
}

export function wellbeingSummary(v: unknown): WellbeingSummary {
  const o = exact<Obj>(v, [...HEADER, "average", "checkins", "difficultShare", "highStressShare", "participants", "testTaken", "topReasons", "weekdays", "weekly"]);
  const h = header(o), count = groupCount(h.minGroupSize);
  const result: WellbeingSummary = {
    ...h,
    participants: kpi(o.participants, count),
    checkins: kpi(o.checkins, num),
    average: kpi(o.average, mood),
    difficultShare: kpi(o.difficultShare, share),
    testTaken: kpi(o.testTaken, count),
    highStressShare: kpi(o.highStressShare, share),
    weekly: weekDays(o.weekly, ["average", "distribution"], (w) => {
      const distribution = list(w.distribution, orNull(share));
      if (distribution.length !== 5) bad();
      return { average: orNull(mood)(w.average), distribution };
    }),
    weekdays: list(o.weekdays, (item, index) => {
      const d = exact<Obj>(item, ["average", "day"]);
      if (d.day !== index + 1) bad();
      return { day: index + 1, average: orNull(mood)(d.average) };
    }),
    topReasons: list(o.topReasons, (item) => {
      const r = exact<Obj>(item, ["name", "share"]);
      return { name: str(r.name), share: share(r.share) };
    }),
  };
  if (result.topReasons.length > 3) bad();
  if (!h.sufficient) {
    if (result.participants.value !== null) bad();
    empty(o, ["weekly", "weekdays", "topReasons"]);
  } else if (result.participants.value === null || result.weekdays.length !== 7) bad();
  return result;
}

export function wellbeingReasons(v: unknown): WellbeingReasons {
  const o = exact<Obj>(v, [...HEADER, "matrix", "ranking", "trend"]);
  const h = header(o);
  const result: WellbeingReasons = {
    ...h,
    ranking: list(o.ranking, (item) => {
      const r = exact<Obj>(item, ["average", "name", "share"]);
      return { name: str(r.name), share: share(r.share), average: mood(r.average) };
    }),
    matrix: list(o.matrix, (item) => {
      const r = exact<Obj>(item, ["cells", "name"]);
      const cells = list(r.cells, orNull(share));
      if (cells.length !== 5) bad();
      return { name: str(r.name), cells };
    }),
    trend: list(o.trend, (item) => {
      const r = exact<Obj>(item, ["name", "weeks"]);
      return { name: str(r.name), weeks: weekDays(r.weeks, ["share"], (w) => ({ share: orNull(share)(w.share) })) };
    }),
  };
  if (result.trend.length > 3) bad();
  if (!h.sufficient) empty(o, ["ranking", "matrix", "trend"]);
  return result;
}

export function wellbeingStress(v: unknown): WellbeingStress {
  const o = exact<Obj>(v, [...HEADER, "average", "careers", "highShare", "levels", "participants", "weekly"]);
  const h = header(o);
  const result: WellbeingStress = {
    ...h,
    participants: kpi(o.participants, groupCount(h.minGroupSize)),
    average: kpi(o.average, score),
    highShare: kpi(o.highShare, share),
    levels: list(o.levels, (item) => {
      const l = exact<Obj>(item, ["label", "level", "students"]);
      const n = orNull(num)(l.students);
      if (n !== null && n > 0 && n < h.minGroupSize) bad();
      return { level: str(l.level), label: str(l.label), students: n };
    }),
    weekly: weekDays(o.weekly, ["average", "highShare"], (w) => ({
      average: orNull(score)(w.average),
      highShare: orNull(share)(w.highShare),
    })),
    careers: list(o.careers, (item) => {
      const c = exact<Obj>(item, ["average", "highShare", "name"]);
      return { name: str(c.name), average: orNull(score)(c.average), highShare: orNull(share)(c.highShare) };
    }),
  };
  if (!h.sufficient) {
    if (result.participants.value !== null) bad();
    empty(o, ["levels", "weekly", "careers"]);
  }
  return result;
}

export function wellbeingCareers(v: unknown): WellbeingCareers {
  const o = exact<Obj>(v, [...HEADER, "rows"]);
  const h = header(o), count = groupCount(h.minGroupSize);
  const result: WellbeingCareers = {
    ...h,
    rows: list(o.rows, (item) => {
      const r = exact<Obj>(item, ["average", "difficultShare", "highStressShare", "name", "participants", "topReason"]);
      return {
        name: str(r.name),
        participants: count(r.participants),
        average: mood(r.average),
        difficultShare: orNull(share)(r.difficultShare),
        highStressShare: orNull(share)(r.highStressShare),
        topReason: nullable(r.topReason),
      };
    }),
  };
  if (!h.sufficient) empty(o, ["rows"]);
  return result;
}

export function wellbeingParticipation(v: unknown): WellbeingParticipation {
  const o = exact<Obj>(v, [...HEADER, "active", "checkinsPerParticipant", "registered", "sharingShare", "weekly"]);
  const h = header(o), count = groupCount(h.minGroupSize);
  const result: WellbeingParticipation = {
    ...h,
    registered: orNull(count)(o.registered),
    sharingShare: orNull(share)(o.sharingShare),
    active: kpi(o.active, count),
    checkinsPerParticipant: kpi(o.checkinsPerParticipant, ranged(1, 10000)),
    weekly: weekDays(o.weekly, ["active"], (w) => ({ active: orNull(count)(w.active) })),
  };
  if (!h.sufficient) {
    if (result.registered !== null || result.active.value !== null) bad();
    empty(o, ["weekly"]);
  }
  return result;
}

export function careersAvailable(v: unknown): CareerOption[] {
  const o = exact<Obj>(v, [...HEADER, "careers"]);
  header(o);
  return list(o.careers, (item) => {
    const c = exact<Obj>(item, ["id", "name"]);
    return { id: id(c.id), name: str(c.name) };
  });
}
