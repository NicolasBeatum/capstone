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
}
export interface StudentPage {
  items: Student[];
  total: number;
  page: number;
  pageSize: number;
}
export interface EventTypeContent {
  code: string;
  name: string;
  order: number;
}
export interface EventType extends EventTypeContent {
  id: string;
  revision: number;
}
export interface EventContent {
  typeId: string | null;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  requiresRegistration: boolean;
  registrationUrl: string | null;
  registrationDeadline: string | null;
  registrationClosed: boolean;
}
export interface InstitutionalEvent extends EventContent {
  id: string;
  status: "draft" | "published" | "cancelled";
  publishedAt: string | null;
  revision: number;
}
export interface FormOptions {
  careers: { id: string; name: string }[];
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
export type EmotionPeriod = 7 | 30 | 90;
export interface EmotionDistribution {
  value: number;
  label: string;
  checkins: number;
}
export interface EmotionWeek {
  weekStart: string;
  participants: number | null;
  average: number | null;
}
export interface EmotionCareer {
  name: string;
  participants: number;
  average: number;
}
/** Agregados anónimos del servidor. Con `sufficient: false` no hay ningún valor. */
export interface EmotionDashboard {
  days: EmotionPeriod;
  from: string;
  to: string;
  minGroupSize: number;
  sufficient: boolean;
  participants: number | null;
  checkins: number | null;
  average: number | null;
  distribution: EmotionDistribution[];
  weekly: EmotionWeek[];
  careers: EmotionCareer[];
}

// Dashboard de bienestar (spec 023). Todo valor viene ya protegido desde el servidor:
// `null` significa «sin datos suficientes» (menos de 5 estudiantes) y nunca se convierte en 0.
export type WellbeingPeriod = 7 | 30 | 90;
export type WellbeingTab = "summary" | "reasons" | "stress" | "careers" | "participation";
/** Métrica con el valor del periodo anterior de igual duración. */
export interface Kpi {
  value: number | null;
  previous: number | null;
}
export interface WellbeingHeader {
  days: WellbeingPeriod;
  from: string;
  to: string;
  minGroupSize: number;
  careerId: string | null;
  sufficient: boolean;
}
export interface WellbeingSummary extends WellbeingHeader {
  participants: Kpi;
  checkins: Kpi;
  average: Kpi;
  difficultShare: Kpi;
  testTaken: Kpi;
  highStressShare: Kpi;
  /** `distribution`: % de check-ins de Muy mal a Muy bien. */
  weekly: { weekStart: string; average: number | null; distribution: (number | null)[] }[];
  /** `day`: 1 lunes … 7 domingo. */
  weekdays: { day: number; average: number | null }[];
  topReasons: { name: string; share: number }[];
}
export interface WellbeingReasons extends WellbeingHeader {
  ranking: { name: string; share: number; average: number }[];
  matrix: { name: string; cells: (number | null)[] }[];
  trend: { name: string; weeks: { weekStart: string; share: number | null }[] }[];
}
export interface WellbeingStress extends WellbeingHeader {
  participants: Kpi;
  average: Kpi;
  highShare: Kpi;
  levels: { level: string; label: string; students: number | null }[];
  weekly: { weekStart: string; average: number | null; highShare: number | null }[];
  careers: { name: string; average: number | null; highShare: number | null }[];
}
export interface WellbeingCareerRow {
  name: string;
  participants: number;
  average: number;
  difficultShare: number | null;
  highStressShare: number | null;
  topReason: string | null;
}
export interface WellbeingCareers extends WellbeingHeader {
  rows: WellbeingCareerRow[];
}
export interface WellbeingParticipation extends WellbeingHeader {
  registered: number | null;
  sharingShare: number | null;
  active: Kpi;
  checkinsPerParticipant: Kpi;
  weekly: { weekStart: string; active: number | null }[];
}
export interface WellbeingTabData {
  summary: WellbeingSummary;
  reasons: WellbeingReasons;
  stress: WellbeingStress;
  careers: WellbeingCareers;
  participation: WellbeingParticipation;
}
export interface CareerOption {
  id: string;
  name: string;
}
