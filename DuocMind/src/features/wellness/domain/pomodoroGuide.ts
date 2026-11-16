import type { TutorialStep } from '@/shared/tutorial/domain/tutorialSteps';

/* Pasos de la guía del Pomodoro. Usan el mismo formato que el tutorial del inicio. */
export const POMODORO_GUIDE_STEPS: readonly TutorialStep[] = [
  {
    id: 'que-es',
    title: '¿Qué es Pomodoro?',
    body: 'Es una forma de estudiar por bloques: te concentras un rato, descansas y repites. Así cuesta menos partir y tu mente no se agota.',
    kind: 'info',
    target: null,
  },
  {
    id: 'estudio',
    title: 'Bloque de estudio',
    body: 'Mientras el reloj está azul, es tiempo de concentración: deja el celular de lado, cierra las redes y enfócate en una sola tarea.',
    kind: 'info',
    target: 'pomodoroTimer',
  },
  {
    id: 'descanso',
    title: 'Bloque de descanso',
    body: 'Cuando termina un bloque, el reloj se vuelve verde: es tu descanso. Levántate, toma agua o estírate. Descansar también es parte de estudiar.',
    kind: 'info',
    target: 'pomodoroTimer',
  },
  {
    id: 'configuracion',
    title: 'Arma tu sesión',
    body: 'Aquí eliges cuántos minutos estudias, cuánto descansas y cuántos bloques haces. Parte con algo cómodo.',
    kind: 'info',
    target: 'pomodoroConfig',
  },
  {
    id: 'cierre',
    title: '¡Tu última sesión queda guardada!',
    body: 'Intenta sumar cada vez más tiempo y verás cómo tu hábito de concentración crece. Puedes volver a ver esta guía con el botón ?.',
    kind: 'closing',
    target: null,
  },
];
