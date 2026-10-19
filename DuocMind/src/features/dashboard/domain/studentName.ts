function capitalize(word: string): string {
  return word.charAt(0).toLocaleUpperCase('es') + word.slice(1).toLocaleLowerCase('es');
}

/**
 * Primer nombre listo para el saludo: sin espacios sobrantes, solo la primera palabra
 * (evita que "María José" u otros nombres compuestos corten el título) y con mayúscula inicial.
 */
export function greetingName(firstName: string | null | undefined): string | null {
  const first = firstName?.trim().split(/\s+/)[0];
  return first ? capitalize(first) : null;
}

/** Iniciales del avatar a partir del primer nombre y el primer apellido. */
export function studentInitials(firstName: string | null | undefined, lastName: string | null | undefined): string {
  return [firstName, lastName]
    .map((part) => part?.trim().charAt(0).toLocaleUpperCase('es') ?? '')
    .join('');
}
