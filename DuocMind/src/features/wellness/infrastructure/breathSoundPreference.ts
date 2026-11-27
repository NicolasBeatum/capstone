/* Preferencia «Sonido» de la respiración 4-7-8. Vive solo en el dispositivo: no se envía ni se mide. */

/** Lo mínimo que necesitamos del almacenamiento; `platformSecureKeyValueStorage` lo cumple. */
export interface PreferenceStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const BREATH_SOUND_KEY = 'duocmind.breathing.sound.v1';

export interface BreathSoundPreference {
  /** Encendido por defecto: solo un '0' guardado lo apaga. Ante cualquier error, encendido. */
  load(): Promise<boolean>;
  /** Guarda la elección; si no se puede guardar, no pasa nada grave y no se avisa. */
  save(enabled: boolean): Promise<void>;
}

export function createBreathSoundPreference(storage: PreferenceStorage): BreathSoundPreference {
  return {
    async load() {
      try {
        return (await storage.getItem(BREATH_SOUND_KEY)) !== '0';
      } catch {
        return true;
      }
    },

    async save(enabled) {
      try {
        await storage.setItem(BREATH_SOUND_KEY, enabled ? '1' : '0');
      } catch {
        // Sin guardar, la elección se olvida al cerrar la app; no es grave.
      }
    },
  };
}
