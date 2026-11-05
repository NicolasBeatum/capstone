/* Herramientas destacadas del home. Datos estáticos de prueba con la misma forma que
 * devolverá la RPC herramientas_home() (ultima y del_dia), para reemplazarlos después. */
export type FeaturedToolSlot = 'ultima' | 'del_dia';

export type FeaturedToolIcon = 'moon' | 'wind';

export interface FeaturedTool {
  slot: FeaturedToolSlot;
  title: string;
  description: string;
  category: string;
  icon: FeaturedToolIcon;
}

export const FEATURED_SLOT_LABELS: Record<FeaturedToolSlot, string> = {
  ultima: 'Lo último',
  del_dia: 'Recomendación del día',
};

export const FEATURED_TOOLS: FeaturedTool[] = [
  {
    slot: 'ultima',
    title: 'Meditación para dormir mejor',
    description: 'Una pausa guiada para soltar el día.',
    category: 'Meditación',
    icon: 'moon',
  },
  {
    slot: 'del_dia',
    title: 'Respira 3 minutos',
    description: 'Un momento para pausar y respirar.',
    category: 'Respiración',
    icon: 'wind',
  },
];
