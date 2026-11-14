import { getDocumentAsync } from 'expo-document-picker';
import { File } from 'expo-file-system';
import type { PickTimetableFile } from '../application/pickTimetableFile';
import { DuocTimetableError, MAX_TIMETABLE_BYTES } from '../domain/duocTimetable';

export const pickTimetableFile: PickTimetableFile = async () => {
  const result = await getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets.length) return { kind: 'cancelled' };
  // La copia en caché contiene datos personales: se borra siempre después de leerla.
  const file = new File(result.assets[0].uri);
  try {
    const size = result.assets[0].size ?? file.size ?? 0;
    if (size > MAX_TIMETABLE_BYTES) throw new DuocTimetableError('too_large');
    const bytes = await file.bytes();
    if (bytes.byteLength > MAX_TIMETABLE_BYTES) throw new DuocTimetableError('too_large');
    return { kind: 'file', bytes };
  } finally {
    try {
      if (file.exists) file.delete();
    } catch {
      // Si el sistema ya limpió la caché no hay nada que borrar.
    }
  }
};
