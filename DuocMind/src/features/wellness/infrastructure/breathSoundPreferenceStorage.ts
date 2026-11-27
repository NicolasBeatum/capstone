import { platformSecureKeyValueStorage } from '@/shared/backend/infrastructure/platformSecureStorage';

import { createBreathSoundPreference } from './breathSoundPreference';

/*
 * Instancia que usa la app. Va en su propio archivo porque `breathSoundPreference.ts` no importa nada
 * con el alias `@/`: así las pruebas con `node --test` pueden cargarlo con un almacenamiento falso.
 */
export const breathSoundPreference = createBreathSoundPreference(platformSecureKeyValueStorage);
