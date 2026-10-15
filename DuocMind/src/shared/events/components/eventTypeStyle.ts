import type { EventType } from '@/shared/events/domain/institutionalEvent';

/** Colores de un tipo de evento; se conservan en la lista, el destacado y el detalle. */
export interface EventTypeStyle {
  /** Punto del filtro. */
  dot: string;
  /** Fondo y texto de la etiqueta y del bloque de fecha. */
  soft: string;
  strong: string;
  /** Extremos del degradado del destacado y de la cabecera del detalle. */
  gradientFrom: string;
  gradientTo: string;
}

const STYLES: Record<string, EventTypeStyle> = {
  charla: { dot: '#7b66c9', soft: '#e3dbf7', strong: '#4f3d99', gradientFrom: '#6a52b8', gradientTo: '#2a2352' },
  taller: { dot: '#2e9a76', soft: '#cdebd9', strong: '#1d6148', gradientFrom: '#2f8f73', gradientTo: '#173f3a' },
  actividad: { dot: '#e07b39', soft: '#fbd9c2', strong: '#9a4219', gradientFrom: '#d9793a', gradientTo: '#6e2f1a' },
};

/* Un tipo nuevo creado en la base sin color propio usa el neutro de la app. */
const NEUTRAL: EventTypeStyle = {
  dot: '#8a8272', soft: '#ece4cc', strong: '#4b463c', gradientFrom: '#2d4163', gradientTo: '#1a2b44',
};

export function eventTypeStyle(type: EventType | null): EventTypeStyle {
  return (type && STYLES[type.code]) || NEUTRAL;
}
