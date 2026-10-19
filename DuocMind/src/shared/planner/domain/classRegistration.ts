import {
  invalid,
  putSemester,
  putSubject,
  type ScheduleDocument,
  type ScheduleSubject,
  type Semester,
  type WeeklyBlock,
} from './schedule.ts';
import { findBlockOverlaps, putBlock } from './weeklySchedule.ts';

export function prepareClassRegistration(
  base: ScheduleDocument,
  semester: Semester | null,
  subject: ScheduleSubject,
  blocks: WeeklyBlock[],
) {
  if (!blocks.length) invalid('Agrega al menos un bloque semanal.');
  if (blocks.some((block) => base.blocks.some((existing) => existing.id === block.id))) {
    invalid('Ese bloque ya existe. Vuelve a abrir el formulario.');
  }
  let document = putSubject(semester ? putSemester(base, semester) : base, subject);
  for (const block of blocks) {
    if (block.subjectId !== subject.id) invalid('Revisa el ramo de los bloques.');
    document = putBlock(document, block, true);
  }
  const seen = new Set<string>();
  const overlaps = blocks.flatMap((block) =>
    findBlockOverlaps(document, block).flatMap((other) => {
      const key = [block.id, other.id].sort().join('/');
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ block, other }];
    })
  );
  return { document, overlaps };
}
