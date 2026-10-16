/** Largo máximo del nombre: cubre nombres compuestos como "María José". */
export const FIRST_NAME_MAX_LENGTH = 30;
/** Largo máximo del apellido: cubre dos apellidos juntos. */
export const LAST_NAME_MAX_LENGTH = 40;

/**
 * Deja en un nombre o apellido solo letras (con tildes y ñ), espacios, guion y apóstrofe.
 * Quita números y otros símbolos, colapsa los espacios repetidos y corta al largo máximo.
 */
export function sanitizePersonName(input: string, maxLength: number): string {
  return input
    .replace(/[^\p{L}\s'’-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}
