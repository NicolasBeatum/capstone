import { isSafeImagePath } from '../domain/wellnessResource.ts';

export const IMAGE_BUCKET = 'herramientas';

/**
 * URL pública de una imagen del bucket `herramientas`. Devuelve null si falta la configuración o
 * si la ruta no es segura. Cada segmento se codifica, de modo que la ruta no puede salirse del
 * bucket ni cambiar la consulta. No hace ninguna solicitud de red.
 */
export function buildPublicImageUrl(baseUrl: string | undefined, path: string | null): string | null {
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl) || !isSafeImagePath(path)) return null;
  const origin = baseUrl.replace(/\/+$/, '');
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${origin}/storage/v1/object/public/${IMAGE_BUCKET}/${encoded}`;
}
