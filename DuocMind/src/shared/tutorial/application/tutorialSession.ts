import { FIRST_STEP, isLastStep, nextStep, positionLabel, previousStep } from '../domain/tutorialFlow.ts';
import { TUTORIAL_STEPS } from '../domain/tutorialSteps.ts';
import type { TutorialStep } from '../domain/tutorialSteps.ts';
import { normalizeOwnerId } from './tutorialProgress.ts';

/**
 * closed: no hay recorrido. steps: se muestra un paso. awaitingCheckin: la persona
 * está en la pantalla de check-in y el recorrido espera. closing: el check-in quedó
 * guardado y se muestra «Todo listo».
 */
export type TutorialPhase = 'closed' | 'steps' | 'awaitingCheckin' | 'closing';
/** auto: primer inicio de sesión, marca la cuenta. manual: «Ver tutorial», nunca escribe. */
export type TutorialMode = 'auto' | 'manual';

export interface TutorialState {
  phase: TutorialPhase;
  index: number;
  mode: TutorialMode;
  /** Cuenta a la que se marcará «visto»; solo en modo automático. */
  ownerId: string | null;
  /** Sube con cada reinicio: invalida ofertas que se resolvieron tarde. */
  generation: number;
}

export interface TutorialView {
  step: TutorialStep;
  /** Texto de posición, p. ej. «Paso 2 de 6». */
  position: string;
  canGoBack: boolean;
  canSkip: boolean;
  primary: { kind: 'next' | 'register' | 'finish'; label: string; accessibilityLabel: string };
}

const CLOSED: Omit<TutorialState, 'generation'> = {
  phase: 'closed',
  index: FIRST_STEP,
  mode: 'auto',
  ownerId: null,
};

function canGoBack(state: TutorialState, total: number): boolean {
  return state.phase === 'steps' && state.index > FIRST_STEP && !isLastStep(state.index, total);
}

function canSkip(state: TutorialState, total: number): boolean {
  return state.phase === 'steps' && !isLastStep(state.index, total);
}

/** Qué se muestra y qué botones se ofrecen; null si el recorrido no está a la vista. */
export function describeTutorial(
  state: TutorialState,
  steps: readonly TutorialStep[] = TUTORIAL_STEPS,
): TutorialView | null {
  if (state.phase !== 'steps' && state.phase !== 'closing') return null;
  const step = steps[state.index];
  if (!step) return null;
  const total = steps.length;
  const last = isLastStep(state.index, total);

  let primary: TutorialView['primary'];
  if (state.phase === 'closing' || last) {
    primary = { kind: 'finish', label: 'Entendido', accessibilityLabel: 'Entendido, terminar el tutorial' };
  } else if (state.mode === 'auto' && step.kind === 'checkin') {
    primary = {
      kind: 'register',
      label: 'Registrar ahora',
      accessibilityLabel: 'Registrar ahora, abrir el check-in',
    };
  } else {
    primary = { kind: 'next', label: 'Siguiente', accessibilityLabel: `Ir al paso ${state.index + 2}` };
  }

  return {
    step,
    position: positionLabel(state.index, total),
    canGoBack: canGoBack(state, total),
    canSkip: canSkip(state, total),
    primary,
  };
}

/**
 * Estado del recorrido, fuera de React para que sobreviva a la navegación: «Registrar
 * ahora» abre el check-in y, al guardar, el inicio se reemplaza por una instancia nueva.
 * No conoce el almacenamiento: avisa con `onComplete` cuando una cuenta debe quedar
 * marcada como «vista».
 */
export class TutorialSession {
  private state: TutorialState = { ...CLOSED, generation: 0 };
  private lastUser: string | null | undefined = undefined;
  private readonly listeners = new Set<() => void>();
  private readonly onComplete: (ownerId: string) => void;
  private readonly steps: readonly TutorialStep[];

  constructor(onComplete: (ownerId: string) => void, steps: readonly TutorialStep[] = TUTORIAL_STEPS) {
    this.onComplete = onComplete;
    this.steps = steps;
  }

  getSnapshot = (): TutorialState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  captureGeneration(): number {
    return this.state.generation;
  }

  /** Abre el recorrido automático para una cuenta; se ignora si la generación venció. */
  openAuto(ownerId: string, generation: number): boolean {
    const owner = normalizeOwnerId(ownerId);
    if (!owner || generation !== this.state.generation || this.state.phase !== 'closed') return false;
    this.set({ ...this.state, phase: 'steps', index: FIRST_STEP, mode: 'auto', ownerId: owner });
    return true;
  }

  /** Abre el recorrido manual: sin cuenta, sin check-in y sin escritura. */
  openManual(): boolean {
    if (this.state.phase !== 'closed') return false;
    this.set({ ...this.state, phase: 'steps', index: FIRST_STEP, mode: 'manual', ownerId: null });
    return true;
  }

  next(): void {
    const { phase, index, mode } = this.state;
    if (phase !== 'steps' || isLastStep(index, this.steps.length)) return;
    // En automático el paso del check-in avanza solo con «Registrar ahora».
    if (mode === 'auto' && this.steps[index]?.kind === 'checkin') return;
    this.set({ ...this.state, index: nextStep(index, this.steps.length) });
  }

  back(): void {
    if (!canGoBack(this.state, this.steps.length)) return;
    this.set({ ...this.state, index: previousStep(this.state.index) });
  }

  /** «Registrar ahora»: el recorrido espera mientras la persona usa el check-in. */
  startCheckin(): boolean {
    const { phase, index, mode } = this.state;
    if (phase !== 'steps' || mode !== 'auto' || this.steps[index]?.kind !== 'checkin') return false;
    this.set({ ...this.state, phase: 'awaitingCheckin' });
    return true;
  }

  /** La persona volvió del check-in sin guardar: reaparece el paso del check-in. */
  returnWithoutSaving(): void {
    if (this.state.phase !== 'awaitingCheckin') return;
    this.set({ ...this.state, phase: 'steps' });
  }

  /**
   * El check-in quedó guardado. Si es de la cuenta que inició el recorrido, la marca
   * como vista y muestra «Todo listo»; si es de otra, cierra sin marcar a ninguna.
   */
  checkinSaved(userId: string): void {
    if (this.state.phase !== 'awaitingCheckin') return;
    const owner = this.state.ownerId;
    if (!owner || normalizeOwnerId(userId) !== owner) {
      this.close();
      return;
    }
    this.complete(owner);
    this.set({ ...this.state, phase: 'closing', index: this.steps.length - 1 });
  }

  /** Omitir: cierra y, en el recorrido automático, marca la cuenta como vista. */
  skip(): void {
    if (this.state.phase === 'closed') return;
    const { phase, mode, ownerId } = this.state;
    if (phase === 'steps' && mode === 'auto' && ownerId) this.complete(ownerId);
    this.close();
  }

  /** «Entendido»: cierra sin marcar; la cuenta ya quedó marcada al guardar el check-in. */
  finish(): void {
    if (this.state.phase === 'closed') return;
    this.close();
  }

  /** Botón Atrás del sistema: retrocede un paso y, si no puede, omite. */
  systemBack(): void {
    if (canGoBack(this.state, this.steps.length)) this.back();
    else this.skip();
  }

  /** Cambio de sesión: reinicia si la cuenta ya no es la del recorrido o cambió de usuario. */
  accountChanged(userId: string | null): void {
    const user = normalizeOwnerId(userId);
    const changedUser = this.lastUser !== undefined && this.lastUser !== user;
    this.lastUser = user;
    const { phase, mode, ownerId } = this.state;
    const otherOwner = ownerId !== null && ownerId !== user;
    const manualSignedOut = phase !== 'closed' && mode === 'manual' && user === null;
    if (changedUser || otherOwner || manualSignedOut) this.reset();
  }

  reset(): void {
    this.set({ ...CLOSED, generation: this.state.generation + 1 });
  }

  private close(): void {
    this.set({ ...CLOSED, generation: this.state.generation });
  }

  private complete(ownerId: string): void {
    try {
      this.onComplete(ownerId);
    } catch {
      // Un fallo al marcar no debe impedir cerrar ni continuar el recorrido.
    }
  }

  private set(next: TutorialState): void {
    this.state = next;
    for (const listener of [...this.listeners]) listener();
  }
}
