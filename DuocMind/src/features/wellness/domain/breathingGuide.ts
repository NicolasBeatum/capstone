import type { TutorialStep } from '@/shared/tutorial/domain/tutorialSteps';

/* Pasos de la guía de la respiración 4-7-8. Mismo formato que el tutorial del inicio. */
export const BREATHING_GUIDE_STEPS: readonly TutorialStep[] = [
  {
    id: 'que-es',
    title: 'Respiración 4-7-8',
    body: 'Es una técnica para calmar el cuerpo cuando sientes ansiedad o estrés. Soltar el aire más lento de lo que lo tomas ayuda a bajar las revoluciones.',
    kind: 'info',
    target: null,
  },
  {
    id: 'inhala',
    title: 'Inhala · 4',
    body: 'Toma aire por la nariz, suave, mientras el círculo se agranda.',
    kind: 'info',
    target: 'breathingCircle',
  },
  {
    id: 'aguanta',
    title: 'Aguanta · 7',
    body: 'Mantén el aire con calma mientras el círculo se queda quieto.',
    kind: 'info',
    target: 'breathingCircle',
  },
  {
    id: 'exhala',
    title: 'Exhala · 8',
    body: 'Suelta el aire lentamente por la boca mientras el círculo se achica.',
    kind: 'info',
    target: 'breathingCircle',
  },
  {
    id: 'anillo',
    title: 'Sigue el anillo',
    body: 'No tienes que contar: el anillo alrededor del círculo se va llenando y te muestra cuánto queda de cada paso. Son 4 ciclos.',
    kind: 'info',
    target: 'breathingCircle',
  },
  {
    id: 'sonido',
    title: 'Sonido opcional',
    body: 'Con el sonido encendido oirás un soplo suave de aire al inhalar y al exhalar, y un latido cada segundo que te ayuda a contar. Puedes apagarlo con el interruptor de sonido.',
    kind: 'info',
    target: null,
  },
  {
    id: 'cierre',
    title: 'Respira a tu ritmo',
    body: 'Si te mareas o te incomoda aguantar el aire, detente y vuelve a respirar normal. Puedes volver a ver esta guía con el botón ?.',
    kind: 'closing',
    target: null,
  },
];
