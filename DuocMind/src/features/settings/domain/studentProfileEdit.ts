/* Validación de los datos que el estudiante puede editar en «Mi perfil». Sin React ni backend. */

/** Columnas de `estudiante` que la edición puede cambiar. */
export interface StudentProfilePatch {
  primer_nombre?: string;
  segundo_nombre?: string | null;
  primer_apellido?: string;
  segundo_apellido?: string | null;
  numero_telefonico?: string | null;
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_PART = 100;
const MAX_EMAIL = 200;
const NAME_TOKEN = /^\p{L}[\p{L}'’-]*$/u;
const NATIONAL_PHONE = /^\d{9}$/;
const CHILEAN_STORED = /^\+56(\d)(\d{4})(\d{4})$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** Primera palabra y el resto; el resto queda en null si no hay más palabras. */
function splitFirst(tokens: string[]): [string, string | null] {
  const [first, ...rest] = tokens;
  return [first, rest.length ? rest.join(' ') : null];
}

function validTokens(tokens: string[]): boolean {
  return tokens.length > 0 && tokens.join(' ').length <= MAX_PART && tokens.every((token) => NAME_TOKEN.test(token));
}

/** Nombres y apellidos escritos en dos campos; la primera palabra de cada uno es la principal. */
export function parseNames(names: string, surnames: string): Parsed<StudentProfilePatch> {
  const nameTokens = words(names);
  const surnameTokens = words(surnames);
  if (!nameTokens.length) return { ok: false, error: 'Escribe tu nombre.' };
  if (!surnameTokens.length) return { ok: false, error: 'Escribe tu apellido.' };
  if (!validTokens(nameTokens) || !validTokens(surnameTokens)) {
    return { ok: false, error: 'Usa solo letras en tu nombre y apellido.' };
  }
  const [primer_nombre, segundo_nombre] = splitFirst(nameTokens);
  const [primer_apellido, segundo_apellido] = splitFirst(surnameTokens);
  return { ok: true, value: { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido } };
}

export const PHONE_PREFIX = '+56';

/* Filtros de escritura: descartan en silencio lo que no corresponde, sin avisos. */

/** Solo letras, espacios, apóstrofe y guion; sin espacios dobles ni inicios con símbolo. */
export function sanitizeNameInput(text: string): string {
  return text
    .replace(/[^\p{L}\s'’-]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '')
    .replace(/(^|\s)['’-]+/g, '$1')
    .slice(0, MAX_PART);
}

/** Solo dígitos, hasta 9. Un número pegado con el +56 delante pierde ese prefijo, que ya está fijo. */
export function sanitizePhoneInput(text: string): string {
  const digits = text.replace(/\D/g, '');
  const national = digits.length > 9 && digits.startsWith('56') ? digits.slice(2) : digits;
  return national.slice(0, 9);
}

/** Sin espacios y con el largo máximo del correo. */
export function sanitizeEmailInput(text: string): string {
  return text.replace(/\s/g, '').slice(0, MAX_EMAIL);
}

/** Todo teléfono es chileno: 9 dígitos después del +56 (el 9 de celular va incluido y se puede cambiar). */
export function parsePhone(input: string): Parsed<string | null> {
  const compact = input.replace(/[\s().+-]/g, '');
  if (!compact) return { ok: true, value: null };
  // Quien pega el número completo trae el 56 delante; el prefijo ya está fijo en pantalla.
  const national = compact.length === 11 && compact.startsWith('56') ? compact.slice(2) : compact;
  if (!NATIONAL_PHONE.test(national)) {
    return { ok: false, error: 'Ingresa los 9 dígitos de tu número, por ejemplo 9 1234 5678.' };
  }
  return { ok: true, value: `${PHONE_PREFIX}${national}` };
}

/** Parte editable de un teléfono guardado: sin el +56 y agrupada. Un valor no chileno se muestra tal cual. */
export function nationalPhone(stored: string | null): string {
  if (!stored) return '';
  const match = CHILEAN_STORED.exec(stored.replace(/[\s().-]/g, ''));
  return match ? `${match[1]} ${match[2]} ${match[3]}` : stored;
}

/** Teléfono para mostrar: «+56 9 1234 5678» si es chileno de 9 dígitos. */
export function formatPhone(stored: string): string {
  return CHILEAN_STORED.test(stored.replace(/[\s().-]/g, '')) ? `${PHONE_PREFIX} ${nationalPhone(stored)}` : stored;
}

/** Correo en minúsculas; es obligatorio porque es la cuenta de acceso. */
export function parseEmail(input: string): Parsed<string> {
  const email = input.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL || !EMAIL.test(email)) {
    return { ok: false, error: 'Ingresa un correo válido.' };
  }
  return { ok: true, value: email };
}
