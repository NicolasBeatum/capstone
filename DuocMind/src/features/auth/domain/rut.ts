/** Largo máximo de un RUT sin formato: 8 dígitos del cuerpo más el dígito verificador. */
const RUT_MAX_CHARS = 9;
/** Un RUT chileno tiene al menos 7 dígitos de cuerpo y el dígito verificador. */
const RUT_MIN_CHARS = 8;

function cleanRut(input: string): string {
  return input.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, RUT_MAX_CHARS);
}

/**
 * Da formato ##.###.###-# a lo que escriba la persona, sin importar cómo lo ingrese
 * (con o sin puntos, guion o espacios). La K solo se conserva como dígito verificador.
 */
export function formatRut(input: string): string {
  const cleaned = cleanRut(input);
  if (cleaned.length === 0) return '';

  const verifier = cleaned.slice(-1);
  const body = cleaned.slice(0, -1).replace(/K/g, '');
  if (cleaned.length === 1) return verifier === 'K' ? '' : verifier;
  if (body.length === 0) return '';

  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${verifier}`;
}

/** Indica si el RUT ya tiene cuerpo y dígito verificador completos. */
export function isRutComplete(input: string): boolean {
  const cleaned = cleanRut(input);
  return cleaned.length >= RUT_MIN_CHARS && /^\d+[0-9K]$/.test(cleaned);
}
