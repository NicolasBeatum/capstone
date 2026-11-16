import React from 'react';
import type { TutorialView } from '@/shared/tutorial/application/tutorialSession';
import { TutorialOverlay, type TutorialTargets } from '@/shared/tutorial/components/TutorialOverlay';
import type { TutorialStep } from '@/shared/tutorial/domain/tutorialSteps';
import { GrowingBrote } from './GrowingBrote';

interface ToolGuideProps {
  steps: readonly TutorialStep[];
  /** Paso actual; null si la guía está cerrada. */
  stepIndex: number | null;
  targets: TutorialTargets;
  onChangeStep: (index: number) => void;
  /** Se llama al terminar u omitir la guía. */
  onClose: () => void;
}

/**
 * Recorrido por una herramienta de Bienestar (Pomodoro, respiración…), con el mismo diseño
 * que el tutorial del inicio. El último paso muestra al Brote creciendo.
 */
export function ToolGuide({ steps, stepIndex, targets, onChangeStep, onClose }: ToolGuideProps) {
  if (stepIndex === null) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const view: TutorialView = {
    step: steps[stepIndex],
    position: `Paso ${stepIndex + 1} de ${steps.length}`,
    canGoBack: !isFirst,
    canSkip: !isLast,
    primary: isLast
      ? { kind: 'finish', label: '¡Vamos!', accessibilityLabel: 'Terminar la guía' }
      : { kind: 'next', label: 'Siguiente', accessibilityLabel: 'Ir al siguiente paso' },
  };

  return (
    <TutorialOverlay
      visible
      view={view}
      targets={targets}
      onPrimary={() => (isLast ? onClose() : onChangeStep(stepIndex + 1))}
      onBack={() => onChangeStep(stepIndex - 1)}
      onSkip={onClose}
      onSystemBack={() => (isFirst ? onClose() : onChangeStep(stepIndex - 1))}
      illustration={isLast ? <GrowingBrote key="brote" /> : null}
    />
  );
}
