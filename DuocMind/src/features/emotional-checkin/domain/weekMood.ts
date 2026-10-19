import type { CheckinMood } from '../application/localCheckinStore';

/** Escala 1 (Muy mal) … 5 (Muy bien), en el mismo orden que el selector. */
const SCALE: CheckinMood[] = ['Muy mal', 'Mal', 'Neutro', 'Bien', 'Muy bien'];
const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export interface WeekMoodDay {
  /** Inicial del día para el eje del gráfico. */
  label: string;
  /** Nombre completo, para lectores de pantalla. */
  name: string;
  /** Ánimo más cercano al promedio del día; null si no hubo check-ins. */
  mood: CheckinMood | null;
  /** Promedio de la escala dividido por 5 (0.2 a 1); null si no hubo check-ins. */
  level: number | null;
  count: number;
}

export interface WeekRange {
  from: Date;
  to: Date;
}

/** Lunes = 0 … domingo = 6. */
export function weekDayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Semana local que contiene `now`: desde el lunes 00:00 hasta el lunes siguiente, sin incluirlo. */
export function currentWeekRange(now: Date): WeekRange {
  // Se construye con año, mes y día para que un cambio de horario no corra los límites.
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekDayIndex(now));
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
  return { from, to };
}

/** Resume los check-ins de la semana de `now` en un ánimo promedio por día. */
export function summarizeWeek(
  entries: readonly { mood: CheckinMood; createdAt: string }[],
  now: Date,
): WeekMoodDay[] {
  const { from, to } = currentWeekRange(now);
  const sums = new Array<number>(7).fill(0);
  const counts = new Array<number>(7).fill(0);

  for (const entry of entries) {
    const createdAt = new Date(entry.createdAt);
    const value = SCALE.indexOf(entry.mood) + 1;
    if (Number.isNaN(createdAt.getTime()) || value === 0) continue;
    if (createdAt < from || createdAt >= to) continue;
    const day = weekDayIndex(createdAt);
    sums[day] += value;
    counts[day] += 1;
  }

  return DAY_LABELS.map((label, day) => {
    const count = counts[day];
    if (count === 0) return { label, name: DAY_NAMES[day], mood: null, level: null, count };
    const average = sums[day] / count;
    return {
      label,
      name: DAY_NAMES[day],
      mood: SCALE[Math.round(average) - 1],
      level: average / SCALE.length,
      count,
    };
  });
}
