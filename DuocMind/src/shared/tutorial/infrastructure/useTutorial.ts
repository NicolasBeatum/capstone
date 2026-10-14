import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { resolveTutorialOffer } from '../application/tutorialProgress';
import { describeTutorial } from '../application/tutorialSession';
import { tutorialOwnerGateway } from './tutorialOwnerGateway';
import { tutorialProgressStore } from './tutorialProgressStorage';
import { tutorialSession, watchTutorialAccount } from './tutorialRuntime';

// Acciones estables: la instancia única no cambia entre renders.
const next = () => tutorialSession.next();
const back = () => tutorialSession.back();
const skip = () => tutorialSession.skip();
const finish = () => tutorialSession.finish();
const systemBack = () => tutorialSession.systemBack();
const startManually = () => {
  tutorialSession.openManual();
};
const registerNow = () => tutorialSession.startCheckin();
const returnWithoutSaving = () => tutorialSession.returnWithoutSaving();

/**
 * Vista de React sobre el recorrido. La cuenta a la que se marcará «visto» se captura al
 * abrir el recorrido automático y no se vuelve a leer de la sesión: un cambio de cuenta
 * no puede marcar la cuenta equivocada. El recorrido manual no tiene cuenta y nunca escribe.
 */
export function useTutorial() {
  const state = useSyncExternalStore(
    tutorialSession.subscribe,
    tutorialSession.getSnapshot,
    tutorialSession.getSnapshot,
  );
  const view = useMemo(() => describeTutorial(state), [state]);

  useEffect(() => {
    watchTutorialAccount();
  }, []);

  /** Tras el inicio de sesión: abre el recorrido solo si esta cuenta aún no lo ha visto. */
  const offerAfterLogin = useCallback(async () => {
    // Si la sesión cambia mientras se lee el estado, la generación vence y se descarta.
    const generation = tutorialSession.captureGeneration();
    const owner = await resolveTutorialOffer(tutorialOwnerGateway, tutorialProgressStore);
    if (owner) tutorialSession.openAuto(owner, generation);
  }, []);

  return {
    state,
    view,
    /** El recorrido tiene un paso a la vista (no mientras se usa el check-in). */
    visible: view !== null,
    offerAfterLogin,
    startManually,
    next,
    back,
    skip,
    finish,
    systemBack,
    registerNow,
    returnWithoutSaving,
  };
}
