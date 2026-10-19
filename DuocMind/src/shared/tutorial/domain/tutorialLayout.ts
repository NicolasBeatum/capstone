export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export type CardPlacement = 'above' | 'below' | 'center';

/** Margen del resalte alrededor del elemento medido, en px. */
export const SPOTLIGHT_PADDING = 6;
/** Tolerancia de redondeo al comprobar que un elemento cabe en la ventana. */
const EDGE_TOLERANCE = 1;

/**
 * Un elemento se puede resaltar si tiene tamaño y cabe entero en la ventana. Si no,
 * el paso se muestra centrado y sin resalte.
 */
export function isMeasurable(rect: Rect, window: WindowSize): boolean {
  const values = [rect.x, rect.y, rect.width, rect.height];
  if (!values.every(Number.isFinite)) return false;
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.x >= -EDGE_TOLERANCE &&
    rect.y >= -EDGE_TOLERANCE &&
    rect.x + rect.width <= window.width + EDGE_TOLERANCE &&
    rect.y + rect.height <= window.height + EDGE_TOLERANCE
  );
}

/** Rectángulo del resalte: el elemento con su margen, sin salirse de la ventana. */
export function spotlightRect(rect: Rect, window: WindowSize): Rect {
  const x = Math.max(rect.x - SPOTLIGHT_PADDING, 0);
  const y = Math.max(rect.y - SPOTLIGHT_PADDING, 0);
  const right = Math.min(rect.x + rect.width + SPOTLIGHT_PADDING, window.width);
  const bottom = Math.min(rect.y + rect.height + SPOTLIGHT_PADDING, window.height);
  return { x, y, width: right - x, height: bottom - y };
}

/** La tarjeta va debajo de un elemento de la mitad superior y encima de uno de la inferior. */
export function cardPlacement(rect: Rect | null, window: WindowSize): CardPlacement {
  if (!rect) return 'center';
  return rect.y + rect.height / 2 > window.height / 2 ? 'above' : 'below';
}
