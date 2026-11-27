import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import type { BreathSoundPlayer } from '../application/breathingSoundController';
import type { BreathSoundId } from '../domain/breathingSounds';
import { createBreathSoundPlayerWith } from './breathSoundPlayerCore';

/* Sonidos de la respiración 4-7-8 (spec 024): un reproductor de `expo-audio` por archivo, creados una sola vez. */

const SOURCES: Record<BreathSoundId, number> = {
  inhale: require('../../../../assets/sounds/breathing/inhale.wav') as number,
  hold: require('../../../../assets/sounds/breathing/hold.wav') as number,
  exhale: require('../../../../assets/sounds/breathing/exhale.wav') as number,
};

export function createBreathSoundPlayer(): BreathSoundPlayer {
  return createBreathSoundPlayerWith({
    sources: SOURCES,
    createPlayer: (source) => createAudioPlayer(source),
    configureAudio: () =>
      setAudioModeAsync({
        playsInSilentMode: false, // con el teléfono en silencio no suena nada (spec, hallazgo 8)
        interruptionMode: 'mixWithOthers', // no pausa la música de la persona (RF-006.3)
        shouldPlayInBackground: false,
        allowsRecording: false,
      }),
  });
}
