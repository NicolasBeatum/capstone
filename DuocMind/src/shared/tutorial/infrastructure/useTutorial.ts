import { useCallback, useEffect, useRef, useState } from 'react';
import { completeTutorial, resolveTutorialOffer } from '../application/tutorialProgress';
import { FIRST_STEP, nextStep, previousStep } from '../domain/tutorialFlow';
import { TUTORIAL_STEPS } from '../domain/tutorialSteps';
import { tutorialOwnerGateway } from './tutorialOwnerGateway';
import { tutorialProgressStore } from './tutorialProgressStorage';

/**
 * Estado del recorrido para el inicio. La cuenta a la que se marcará «visto» se
 * captura al abrir el recorrido automático y no se vuelve a leer de la sesión:
 * un cambio de cuenta no puede marcar la cuenta equivocada. El recorrido manual
 * no tiene cuenta y por eso nunca escribe.
 */
export function useTutorial() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(FIRST_STEP);
  const ownerRef = useRef<string | null>(null);
  const openRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const open = useCallback((owner: string | null) => {
    ownerRef.current = owner;
    openRef.current = true;
    setIndex(FIRST_STEP);
    setVisible(true);
  }, []);

  /** Tras el inicio de sesión: abre el recorrido solo si esta cuenta aún no lo ha visto. */
  const offerAfterLogin = useCallback(async () => {
    if (openRef.current) return;
    const owner = await resolveTutorialOffer(tutorialOwnerGateway, tutorialProgressStore);
    // La pantalla pudo cerrarse (p. ej. al cerrar sesión) mientras se leía el estado.
    if (!owner || !mountedRef.current || openRef.current) return;
    open(owner);
  }, [open]);

  const startManually = useCallback(() => {
    if (openRef.current) return;
    open(null);
  }, [open]);

  const next = useCallback(() => setIndex((current) => nextStep(current, TUTORIAL_STEPS.length)), []);
  const back = useCallback(() => setIndex(previousStep), []);

  /** Cierra de inmediato; omitir y terminar registran lo mismo. */
  const close = useCallback(() => {
    const owner = ownerRef.current;
    ownerRef.current = null;
    openRef.current = false;
    setVisible(false);
    if (owner) void completeTutorial(tutorialProgressStore, owner);
  }, []);

  return {
    visible,
    index,
    steps: TUTORIAL_STEPS,
    offerAfterLogin,
    startManually,
    next,
    back,
    finish: close,
    skip: close,
  };
}
