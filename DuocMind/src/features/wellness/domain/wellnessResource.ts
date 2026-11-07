export interface ResourceCategory {
  id: number;
  name: string;
  order: number;
}

export interface WellnessResource {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  /** Ruta relativa dentro del bucket; null si falta o no es segura. */
  imagePath: string | null;
  /** Solo https; null en cualquier otro caso. */
  videoUrl: string | null;
  createdAt: string;
  categoryIds: number[];
}

export interface ResourceCatalog {
  categories: ResourceCategory[];
  resources: WellnessResource[];
}

export type ResourceIconKey =
  | 'wind'
  | 'meditation'
  | 'book'
  | 'stretch'
  | 'moon'
  | 'heart'
  | 'generic';

export interface ResourceTone {
  key: 'lavender' | 'blue' | 'orange' | 'green';
  background: string;
  foreground: string;
}

const MAX_TITLE_LENGTH = 160;
const MAX_CATEGORY_NAME_LENGTH = 40;
const MAX_IMAGE_PATH_LENGTH = 300;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T/;

/* Los tonos salen de la posición de la categoría y no de su nombre, que viene del servidor. */
const TONES: readonly ResourceTone[] = [
  { key: 'lavender', background: '#ece6f7', foreground: '#5b4a9e' },
  { key: 'blue', background: '#e3ecf9', foreground: '#2f4ea3' },
  { key: 'orange', background: '#f9e8d8', foreground: '#a4511a' },
  { key: 'green', background: '#e1f1e8', foreground: '#2f7a55' },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

/** Texto opcional: una cadena vacía o con solo espacios equivale a ausente. */
function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Una ruta de imagen es relativa al bucket: sin esquema, sin `//`, sin `..`, sin `\`,
 * sin caracteres de control, sin consulta ni fragmento, no vacía y de largo acotado.
 */
export function isSafeImagePath(path: unknown): path is string {
  if (typeof path !== 'string') return false;
  if (path.length === 0 || path.length > MAX_IMAGE_PATH_LENGTH) return false;
  if (path.trim().length === 0) return false;
  if (/[\u0000-\u001f\u007f]/.test(path)) return false;
  if (path.startsWith('/') || path.includes('//') || path.includes('\\')) return false;
  if (path.includes('?') || path.includes('#')) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return false;
  return !path.split('/').some((segment) => segment === '..' || segment === '.');
}

function safeVideoUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!/^https:\/\//i.test(text)) return null;
  try {
    return new URL(text).protocol === 'https:' ? text : null;
  } catch {
    return null;
  }
}

function parseCategory(row: unknown): ResourceCategory | null {
  if (!isRecord(row) || !isInteger(row.id)) return null;
  const name = typeof row.nombre === 'string' ? row.nombre.trim() : '';
  if (name.length === 0 || name.length > MAX_CATEGORY_NAME_LENGTH) return null;
  const order = isInteger(row.orden) ? row.orden : 0;
  return { id: row.id, name, order };
}

function parseResource(row: unknown, knownCategories: ReadonlySet<number>): WellnessResource | null {
  if (!isRecord(row) || !isInteger(row.id)) return null;
  const title = typeof row.titulo === 'string' ? row.titulo.trim() : '';
  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) return null;
  if (typeof row.created_at !== 'string' || !ISO_DATE_PATTERN.test(row.created_at)) return null;
  if (Number.isNaN(Date.parse(row.created_at))) return null;

  const links = Array.isArray(row.herramienta_tipoherramienta) ? row.herramienta_tipoherramienta : [];
  const categoryIds = new Set<number>();
  for (const link of links) {
    if (isRecord(link) && isInteger(link.tipo_id) && knownCategories.has(link.tipo_id)) {
      categoryIds.add(link.tipo_id);
    }
  }

  return {
    id: row.id,
    title,
    description: optionalText(row.descripcion),
    content: optionalText(row.contenido),
    imagePath: isSafeImagePath(row.imagen_path) ? row.imagen_path : null,
    videoUrl: safeVideoUrl(row.video_url),
    createdAt: row.created_at,
    categoryIds: [...categoryIds].sort((a, b) => a - b),
  };
}

function compareCategories(a: ResourceCategory, b: ResourceCategory): number {
  return a.order - b.order || a.name.localeCompare(b.name, 'es') || a.id - b.id;
}

function compareResources(a: WellnessResource, b: WellnessResource): number {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id;
}

/**
 * Valida y ordena lo que devuelve el servidor (o la copia local). Lanza si el contenedor no
 * es un objeto con las dos listas; una fila inválida se descarta sin invalidar las demás.
 */
export function parseCatalog(raw: unknown): ResourceCatalog {
  if (!isRecord(raw) || !Array.isArray(raw.categories) || !Array.isArray(raw.resources)) {
    throw new Error('La respuesta de recursos no tiene el formato esperado.');
  }

  const categories: ResourceCategory[] = [];
  const seen = new Set<number>();
  for (const row of raw.categories) {
    const category = parseCategory(row);
    if (category && !seen.has(category.id)) {
      seen.add(category.id);
      categories.push(category);
    }
  }
  categories.sort(compareCategories);

  const resources: WellnessResource[] = [];
  const seenResources = new Set<number>();
  for (const row of raw.resources) {
    const resource = parseResource(row, seen);
    if (resource && !seenResources.has(resource.id)) {
      seenResources.add(resource.id);
      resources.push(resource);
    }
  }
  resources.sort(compareResources);

  return { categories, resources };
}

/**
 * Convierte el catálogo de vuelta a la forma del servidor, para que la copia local se valide
 * con el mismo `parseCatalog` que la descarga.
 */
export function serializeCatalog(catalog: ResourceCatalog): unknown {
  return {
    categories: catalog.categories.map((category) => ({
      id: category.id,
      nombre: category.name,
      orden: category.order,
    })),
    resources: catalog.resources.map((resource) => ({
      id: resource.id,
      titulo: resource.title,
      descripcion: resource.description,
      contenido: resource.content,
      imagen_path: resource.imagePath,
      video_url: resource.videoUrl,
      created_at: resource.createdAt,
      herramienta_tipoherramienta: resource.categoryIds.map((tipoId) => ({ tipo_id: tipoId })),
    })),
  };
}

/** Categorías con al menos un recurso, en el orden del catálogo. */
export function categoriesWithResources(catalog: ResourceCatalog): ResourceCategory[] {
  const used = new Set<number>();
  for (const resource of catalog.resources) {
    for (const id of resource.categoryIds) used.add(id);
  }
  return catalog.categories.filter((category) => used.has(category.id));
}

/** `null` devuelve todos los recursos, una vez cada uno; un id, los de esa categoría. */
export function filterResources(catalog: ResourceCatalog, categoryId: number | null): WellnessResource[] {
  if (categoryId === null) return catalog.resources;
  return catalog.resources.filter((resource) => resource.categoryIds.includes(categoryId));
}

/** Primera categoría del recurso según el orden del catálogo; null si no tiene ninguna. */
export function primaryCategory(catalog: ResourceCatalog, resource: WellnessResource): ResourceCategory | null {
  return catalog.categories.find((category) => resource.categoryIds.includes(category.id)) ?? null;
}

/** Tono para la categoría en la posición dada; cicla si hay más categorías que tonos. */
export function categoryTone(index: number): ResourceTone {
  const position = Number.isInteger(index) ? index : 0;
  return TONES[((position % TONES.length) + TONES.length) % TONES.length];
}

/** Posición de la categoría dentro del catálogo (0 si no se encuentra), para elegir su tono. */
export function categoryIndex(catalog: ResourceCatalog, categoryId: number | null): number {
  if (categoryId === null) return 0;
  const index = catalog.categories.findIndex((category) => category.id === categoryId);
  return index < 0 ? 0 : index;
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* Heurística de presentación: palabras del nombre con un icono genérico de respaldo. */
const ICON_RULES: ReadonlyArray<readonly [RegExp, ResourceIconKey]> = [
  [/estudi|aprend|academ|examen|prueba/, 'book'],
  [/fisic|ejercicio|movimiento|deporte|estir/, 'stretch'],
  [/sueno|dormir|descanso/, 'moon'],
  [/ansied|nervio|panico/, 'meditation'],
  [/estres|respir|relaj|calma/, 'wind'],
  [/animo|emocion|autoestima|afecto/, 'heart'],
];

export function categoryIconKey(name: string): ResourceIconKey {
  const text = normalize(name);
  for (const [pattern, key] of ICON_RULES) {
    if (pattern.test(text)) return key;
  }
  return 'generic';
}

/** Busca por el id que llega de la ruta (cadena o número); null si no es un entero válido. */
export function findResource(catalog: ResourceCatalog, id: number | string | undefined): WellnessResource | null {
  let numeric: number;
  if (typeof id === 'number') numeric = id;
  else if (typeof id === 'string' && /^\d+$/.test(id)) numeric = Number(id);
  else return null;
  if (!Number.isSafeInteger(numeric)) return null;
  return catalog.resources.find((resource) => resource.id === numeric) ?? null;
}

/** La categoría elegida si todavía tiene recursos; si desapareció tras una actualización, «Todos». */
export function effectiveCategoryId(catalog: ResourceCatalog, selectedId: number | null): number | null {
  if (selectedId === null) return null;
  return categoriesWithResources(catalog).some((category) => category.id === selectedId) ? selectedId : null;
}

/** Fecha y hora locales de una marca ISO como «07/11/2026 15:30»; cadena vacía si no es válida. */
export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const two = (value: number) => String(value).padStart(2, '0');
  return `${two(date.getDate())}/${two(date.getMonth() + 1)}/${date.getFullYear()} ${two(date.getHours())}:${two(date.getMinutes())}`;
}
