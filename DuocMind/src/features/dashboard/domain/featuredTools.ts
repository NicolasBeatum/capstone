/* Herramientas destacadas del home, elegidas del mismo catálogo que muestra Bienestar. */
import type { ResourceCatalog, WellnessResource } from '../../wellness/domain/wellnessResource.ts';

export type FeaturedToolSlot = 'ultima' | 'del_dia';

export interface FeaturedTool {
  slot: FeaturedToolSlot;
  resource: WellnessResource;
}

export const FEATURED_SLOT_LABELS: Record<FeaturedToolSlot, string> = {
  ultima: 'Lo último',
  del_dia: 'Recomendación del día',
};

/** Fecha local como «2026-11-08»: la recomendación cambia a medianoche del dispositivo. */
export function localDateKey(date: Date): string {
  const two = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

/* FNV-1a de 32 bits: el mismo día da el mismo número en cualquier dispositivo. */
function hashText(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * «Lo último» es el recurso más nuevo (el catálogo ya viene ordenado así). La recomendación del
 * día sale de los demás, elegida con la fecha como semilla: es la misma durante todo el día y
 * nunca repite la última. Con un solo recurso no hay recomendación; sin recursos, lista vacía.
 */
export function pickFeaturedTools(catalog: ResourceCatalog, dateKey: string): FeaturedTool[] {
  const [latest, ...others] = catalog.resources;
  if (!latest) return [];
  const tools: FeaturedTool[] = [{ slot: 'ultima', resource: latest }];
  if (others.length > 0) {
    // Se ordenan por id para que la elección no dependa de la fecha de creación.
    const candidates = [...others].sort((a, b) => a.id - b.id);
    tools.push({ slot: 'del_dia', resource: candidates[hashText(dateKey) % candidates.length] });
  }
  return tools;
}
