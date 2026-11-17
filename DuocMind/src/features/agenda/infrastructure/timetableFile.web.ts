import { getDocumentAsync } from 'expo-document-picker';
import type { PickTimetableFile } from '../application/pickTimetableFile';
import { DuocTimetableError, MAX_TIMETABLE_BYTES } from '../domain/duocTimetable';

export const pickTimetableFile: PickTimetableFile = async () => {
  const result = await getDocumentAsync({ type: 'application/pdf', multiple: false });
  const file = result.canceled ? undefined : result.assets[0]?.file;
  if (!file) return { kind: 'cancelled' };
  if (file.size > MAX_TIMETABLE_BYTES) throw new DuocTimetableError('too_large');
  return { kind: 'file', bytes: new Uint8Array(await file.arrayBuffer()) };
};
