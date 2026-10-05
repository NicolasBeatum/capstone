const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Días calendario (hora local del equipo) entre la última aplicación y ahora. */
export function daysSinceApplication(appliedAt: string | Date, now: Date = new Date()): number {
  const applied = new Date(appliedAt);
  // Math.round absorbe los días de 23 o 25 horas por cambio de horario.
  return Math.max(0, Math.round((startOfLocalDay(now) - startOfLocalDay(applied)) / MS_PER_DAY));
}

/** Pasado este número de días sin responder el PSS-10 se notifica al estudiante. */
export const STRESS_TEST_REMINDER_DAYS = 30;

/** true si nunca respondió el test o si la última vez fue hace más de 30 días. */
export function isStressTestDue(lastAppliedAt: string | Date | null, now: Date = new Date()): boolean {
  if (!lastAppliedAt) return true;
  return daysSinceApplication(lastAppliedAt, now) > STRESS_TEST_REMINDER_DAYS;
}

export function formatDaysAgo(days: number): string {
  if (days === 0) return 'hoy';
  if (days === 1) return 'hace 1 día';
  return `hace ${days} días`;
}
