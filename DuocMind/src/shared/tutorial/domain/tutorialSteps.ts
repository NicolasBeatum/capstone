/** Elementos del inicio que el recorrido puede resaltar. */
export type TutorialTargetId = 'weekCard' | 'checkin' | 'agenda' | 'events' | 'wellness';

/**
 * info: explica una sección. checkin: invita a registrar el primer check-in.
 * closing: cierra el recorrido tras guardar el registro.
 */
export type TutorialStepKind = 'info' | 'checkin' | 'closing';

export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  kind: TutorialStepKind;
  /** null: el paso no resalta nada y se muestra centrado. */
  target: TutorialTargetId | null;
}

/*
 * Los textos orientan y no son clínicos: no prometen diagnóstico ni tratamiento
 * y dejan la emoción registrada bajo control de la persona. El paso del check-in
 * no sugiere una emoción ni lo presenta como obligatorio. «Sin conexión» se
 * afirma solo de los teléfonos de apoyo, que van incluidos en la app.
 */
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: 'inicio',
    title: 'Tu semana',
    body: 'Aquí ves cómo ha sido tu ánimo durante la semana, según lo que has registrado.',
    kind: 'info',
    target: 'weekCard',
  },
  {
    id: 'agenda',
    title: 'Tu agenda',
    body: 'Organiza tus actividades y los eventos que te interesan en un solo lugar.',
    kind: 'info',
    target: 'agenda',
  },
  {
    id: 'eventos',
    title: 'Eventos',
    body: 'Descubre talleres y actividades institucionales, y agrégalos a tu agenda.',
    kind: 'info',
    target: 'events',
  },
  {
    id: 'bienestar',
    title: 'Bienestar',
    body: 'Encuentra el test mensual de estrés y teléfonos de apoyo que se ven incluso sin conexión, por si necesitas hablar con alguien. DuocMind te orienta, pero no reemplaza la atención de un profesional.',
    kind: 'info',
    target: 'wellness',
  },
  {
    id: 'registro',
    title: 'Cuéntanos cómo te sientes',
    body: 'Con este botón registras cómo te sientes cuando quieras. Tú eliges qué emoción registrar y puedes corregirla. Puedes hacerlo ahora o más tarde.',
    kind: 'checkin',
    target: 'checkin',
  },
  {
    id: 'cierre',
    title: 'Todo listo',
    body: 'Ya conoces lo principal. Puedes volver a ver este recorrido con «Ver tutorial de la app», al final del inicio.',
    kind: 'closing',
    target: null,
  },
];
