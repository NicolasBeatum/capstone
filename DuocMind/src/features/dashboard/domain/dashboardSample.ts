/* Datos de muestra del dashboard hasta que exista la funcionalidad de agenda (horario, pruebas y entregas) */

export interface CurrentClass {
  name: string;
  time: string;
  place: string;
  teacher: string;
  /** Avance de la clase, 0-100 */
  progress: number;
  minutesLeft: number;
  next: { name: string; time: string };
}

export type UpcomingKind = 'exam' | 'delivery' | 'oral';

export interface UpcomingItem {
  id: string;
  kind: UpcomingKind;
  weekday: string;
  day: number;
  title: string;
  detail: string;
  /** Texto del chip de cercanía, ej. 'Mañana' */
  when: string;
  /** Un chip urgente se resalta con color cálido */
  urgent: boolean;
}

export const SAMPLE_CURRENT_CLASS: CurrentClass = {
  name: 'Base de Datos',
  time: '10:15 – 11:45',
  place: 'Laboratorio 402',
  teacher: 'Prof. [Nombre]',
  progress: 60,
  minutesLeft: 38,
  next: { name: 'Ética Profesional', time: '13:00' },
};

export const SAMPLE_UPCOMING: UpcomingItem[] = [
  {
    id: 'exam-web',
    kind: 'exam',
    weekday: 'VIE',
    day: 2,
    title: 'Prueba 2 · Programación Web',
    detail: '09:00 · Sala 301 · vale 30%',
    when: 'Mañana',
    urgent: true,
  },
  {
    id: 'delivery-ethics',
    kind: 'delivery',
    weekday: 'VIE',
    day: 2,
    title: 'Informe · Ética Profesional',
    detail: 'Entrega 23:59 · AVA',
    when: 'Mañana',
    urgent: true,
  },
  {
    id: 'oral-english',
    kind: 'oral',
    weekday: 'LUN',
    day: 5,
    title: 'Control oral · Inglés',
    detail: '15:00 · Online · vale 15%',
    when: '4 días',
    urgent: false,
  },
];

export const SAMPLE_WEEK_INSIGHT = {
  highlight: 'El viernes es tu día más pesado:',
  message: 'una prueba y una entrega. Repasar hoy en bloques cortos puede bajar la presión.',
};
