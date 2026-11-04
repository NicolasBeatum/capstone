/**
 * Paleta cálida del registro: crema, navy y dorado. Los valores salen del diseño aprobado
 * de «Crear cuenta»; `theme.ts` es la paleta fría general y no cubre estos tonos.
 */
export const warmPalette = {
  background: '#F5EEE1',
  card: '#FFFBF4',
  border: '#EADFCB',
  navy: '#1A2638',
  gold: '#F2C14E',
  /** Fondo del bloque destacado de términos. */
  goldSoft: '#FBEFC4',
  textSecondary: '#6B6252',
  success: '#2F9E7A',
  inputBorder: '#DCCFB7',
  /** Texto de ayuda y placeholders; mantiene contraste AA sobre la tarjeta. */
  placeholder: '#8A8272',
  /** Etiqueta «Casi lista» y detalles dorados en texto (más oscuro que `gold` para el contraste). */
  goldText: '#8A5A00',
  error: '#9B3D33',
  white: '#FFFFFF',
} as const;
