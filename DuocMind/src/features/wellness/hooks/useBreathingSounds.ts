import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  createBreathSoundController,
  type BreathSoundController,
} from '../application/breathingSoundController';
import type { BreathMoment } from '../domain/breathing478';
import { createBreathSoundPlayer } from '../infrastructure/breathSoundPlayer';
import { breathSoundPreference } from '../infrastructure/breathSoundPreferenceStorage';

type SessionStatus = 'idle' | 'running' | 'done';

interface Input {
  status: SessionStatus;
  moment: BreathMoment | null;
}

/**
 * Sonidos guiados de la respiración 4-7-8 (spec 024). Encendidos por defecto; la elección se recuerda en el
 * dispositivo. Nunca suenan antes de «Comenzar» y se silencian al detener, al pasar a segundo plano o al salir.
 */
export function useBreathingSounds({ status, moment }: Input) {
  const [enabled, setEnabledState] = useState(true);
  const enabledRef = useRef(true);
  const touchedRef = useRef(false);
  const controllerRef = useRef<BreathSoundController | null>(null);
  const previousStatusRef = useRef<SessionStatus>('idle');

  // Crea el controlador y precarga una sola vez; lee la preferencia guardada; libera todo al desmontar.
  useEffect(() => {
    const player = createBreathSoundPlayer();
    controllerRef.current = createBreathSoundController(player, () => enabledRef.current);
    player.preload().catch(() => undefined);

    let active = true;
    void breathSoundPreference.load().then((saved) => {
      // Si la persona ya tocó el interruptor, su elección manda sobre lo leído.
      if (!active || touchedRef.current) return;
      enabledRef.current = saved;
      setEnabledState(saved);
    });

    return () => {
      active = false;
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  // Empieza la sesión al pasar a «running»; «Detener» (de running a idle) silencia. Pasar a «done» no corta la última exhalación.
  useEffect(() => {
    const previous = previousStatusRef.current;
    previousStatusRef.current = status;
    if (status === 'running' && previous !== 'running') controllerRef.current?.begin();
    else if (status === 'idle' && previous === 'running') controllerRef.current?.stop();
  }, [status]);

  // Solo se avisa al controlador cuando cambia el ciclo o la fase. Al terminar o detenerse la sesión, la clave pasa a null
  // y el controlador queda quieto hasta el siguiente «Comenzar».
  const key = moment ? `${moment.cycle}:${moment.phase.kind}` : null;
  useEffect(() => {
    controllerRef.current?.update(moment);
    // `moment` cambia 20 veces por segundo; la clave basta para detectar cambios de ciclo o fase.
  }, [key]);

  // En segundo plano se silencia; al volver no suena un sonido a mitad de fase.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') controllerRef.current?.stop();
    });
    return () => subscription.remove();
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    touchedRef.current = true;
    enabledRef.current = value;
    setEnabledState(value);
    if (!value) controllerRef.current?.stop();
    void breathSoundPreference.save(value);
  }, []);

  return { enabled, setEnabled };
}
