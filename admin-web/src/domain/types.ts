export type PublicationStatus = "draft" | "published";
export type TestKind = "protected" | "custom";
export interface VersionSummary {
  versionId: string;
  version: number;
  title: string;
  publicationStatus: PublicationStatus;
  active: boolean;
  revision: number;
}
export interface TestCatalog {
  catalogId: string;
  code: string;
  kind: TestKind;
  activeVersionId: string | null;
  versions: VersionSummary[];
}
export interface Option {
  text: string;
  score: number;
}
export interface Question {
  text: string;
  helper: string;
  options: Option[];
  critical?: boolean;
}
export interface ResultLevel {
  key: string;
  label: string;
  content: string;
  min: number;
  max: number;
}
export interface TestContent {
  title: string;
  description: string;
  questions: Question[];
  levels: ResultLevel[];
}
export interface TestVersion extends TestContent, VersionSummary {
  catalogId: string;
  kind: TestKind;
  code: string;
  scoringKind: string;
  publishedAt: string | null;
}
export interface Student {
  id: string;
  name: string;
  email: string | null;
  career: string | null;
  campus: string | null;
}
export interface StudentPage {
  items: Student[];
  total: number;
  page: number;
  pageSize: number;
}
export type TipRule = { kind: "mood"; mood: string } | {
  kind: "result";
  catalogId: string;
  versionId: string;
  version: number;
  level: string;
};
export interface TipContent {
  title: string;
  content: string;
  rules: TipRule[];
}
export interface Tip extends TipContent {
  id: string;
  publicationStatus: PublicationStatus;
  publishedAt: string | null;
  active: boolean;
  revision: number;
}
export interface EventContent {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
}
export interface InstitutionalEvent extends EventContent {
  id: string;
  status: "draft" | "published" | "cancelled";
  publishedAt: string | null;
  revision: number;
}
export interface FormOptions {
  careers: { id: string; name: string; campusId: string }[];
  campuses: { id: string; name: string }[];
  moods: string[];
  resultLevels: {
    catalogId: string;
    versionId: string;
    version: number;
    title: string;
    level: string;
    label: string;
    active: boolean;
  }[];
}
export interface MutationResult {
  id?: string;
  versionId?: string;
  catalogId?: string;
  revision: number;
}
