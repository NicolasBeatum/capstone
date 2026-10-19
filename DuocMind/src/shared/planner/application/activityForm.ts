import { invalid, type ScheduleDocument, type Semester } from '../domain/schedule.ts';
import type { ActivityKind, PersonalActivity } from './plannerStore.ts';

export function activityFormSemester(
  schedule: ScheduleDocument,
  original?: PersonalActivity,
): Semester | null {
  if (original && original.kind !== 'personal' && original.semesterId) {
    const saved = schedule.semesters.find((semester) => semester.id === original.semesterId);
    return {
      id: original.semesterId,
      name: original.semesterName ?? saved?.name ?? 'Semestre anterior',
      startsOn: saved?.startsOn ?? null,
      endsOn: saved?.endsOn ?? null,
    };
  }
  return schedule.semesters.find((semester) => semester.id === schedule.activeSemesterId) ?? null;
}

export function changeActivityType(
  value: PersonalActivity,
  kind: ActivityKind,
  schedule: ScheduleDocument,
  original?: PersonalActivity,
): PersonalActivity {
  if (kind === 'personal') {
    const active = activityFormSemester(schedule);
    const subjectName = schedule.subjects.some((subject) =>
        subject.semesterId === active?.id && subject.name === value.subjectName
      )
      ? value.subjectName
      : null;
    return {
      ...value,
      kind,
      subjectName,
      semesterId: null,
      semesterName: null,
    };
  }
  const semester = activityFormSemester(schedule, original);
  const validSubject = schedule.subjects.some((subject) =>
    subject.semesterId === semester?.id && subject.name === value.subjectName
  );
  const savedSubject = original && original.kind !== 'personal' &&
    original.semesterId === semester?.id &&
    value.subjectName === original.subjectName;
  return {
    ...value,
    kind,
    semesterId: semester?.id ?? null,
    semesterName: semester?.name ?? null,
    subjectName: validSubject || savedSubject ? value.subjectName : null,
  };
}

export function prepareActivityForm(
  value: PersonalActivity,
  schedule: ScheduleDocument,
  original?: PersonalActivity,
): PersonalActivity {
  if (value.kind === 'personal') {
    // Las asociaciones de un traslado explícito se conservan al editar esa personal.
    const savedPersonal = original?.kind === 'personal' ? original : null;
    const active = activityFormSemester(schedule);
    if (
      value.subjectName && value.subjectName !== original?.subjectName &&
      !schedule.subjects.some((subject) =>
        subject.semesterId === active?.id && subject.name === value.subjectName
      )
    ) {
      invalid(
        'Elige un ramo del semestre activo o guarda la actividad sin ramo.',
      );
    }
    return {
      ...value,
      semesterId: savedPersonal?.semesterId ?? null,
      semesterName: savedPersonal?.semesterName ?? null,
    };
  }
  const semester = activityFormSemester(schedule, original);
  if (!semester) {
    invalid('Crea tu horario de clases antes de agregar pruebas o tareas.');
  }
  if (value.semesterId && value.semesterId !== semester.id) {
    invalid(
      'Cambió el semestre activo. Vuelve a abrir la actividad para elegir su ramo.',
    );
  }
  const historicalSubject = original && original.kind !== 'personal' &&
    original.semesterId === semester.id &&
    original.subjectName === value.subjectName;
  if (
    !value.subjectName ||
    !historicalSubject &&
      !schedule.subjects.some((subject) =>
        subject.semesterId === semester.id && subject.name === value.subjectName
      )
  ) {
    invalid(
      'Selecciona un ramo del semestre para guardar esta prueba o tarea.',
    );
  }
  return { ...value, semesterId: semester.id, semesterName: semester.name };
}
