import type {
  FormOptions,
  InstitutionalEvent,
  MutationResult,
  StudentPage,
  TestCatalog,
  TestVersion,
  Tip,
  TipRule,
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
function list<T>(v: unknown, parse: (v: unknown) => T): T[] {
  return Array.isArray(v) ? v.map(parse) : bad();
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
          ["campus", "career", "email", "id", "name"].join()
      ) bad();
      return {
        id: id(s.id),
        name: str(s.name),
        email: nullable(s.email),
        career: nullable(s.career),
        campus: nullable(s.campus),
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
function rule(v: unknown): TipRule {
  const r = obj(v);
  if (r.kind === "mood") return { kind: "mood", mood: str(r.mood) };
  if (r.kind === "result") {
    return {
      kind: "result",
      catalogId: uuid(r.catalogId),
      versionId: id(r.versionId),
      version: positive(r.version),
      level: str(r.level),
    };
  }
  return bad();
}
export function tips(v: unknown): Tip[] {
  return list(v, (v) => {
    const o = obj(v);
    return {
      id: id(o.id),
      title: str(o.title),
      content: str(o.content),
      rules: list(o.rules, rule),
      publicationStatus: status(o.publicationStatus),
      publishedAt: nullable(o.publishedAt),
      active: bool(o.active),
      revision: positive(o.revision),
    };
  });
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
      title: str(o.title),
      description: str(o.description),
      location: str(o.location),
      startsAt: instant(o.startsAt),
      endsAt: instant(o.endsAt),
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
      return { id: id(c.id), name: str(c.name), campusId: id(c.campusId) };
    }),
    campuses: list(o.campuses, (v) => {
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
