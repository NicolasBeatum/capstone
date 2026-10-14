import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { completeTutorial } from '../application/tutorialProgress';
import { TutorialSession } from '../application/tutorialSession';
import { tutorialProgressStore } from './tutorialProgressStorage';

/**
 * Instancia única del recorrido. Vive fuera de React porque atraviesa una navegación:
 * «Registrar ahora» abre el check-in y, al guardar, el inicio se reemplaza por uno nuevo.
 */
export const tutorialSession = new TutorialSession((ownerId) => {
  void completeTutorial(tutorialProgressStore, ownerId);
});

let watching = false;

/**
 * Reinicia el recorrido cuando cambia la sesión, para que no quede estado de una cuenta
 * a la espera de otra. Se suscribe una sola vez; sin configuración de Supabase no hay
 * sesión que vigilar y no se hace nada.
 */
export function watchTutorialAccount(): void {
  if (watching) return;
  try {
    getSupabaseClient().auth.onAuthStateChange((_event, session) => {
      tutorialSession.accountChanged(session?.user.id ?? null);
    });
    watching = true;
  } catch {
    // Sin cliente de Supabase el recorrido manual sigue funcionando.
  }
}

/**
 * Avisa que el check-in quedó guardado. Nunca lanza: un fallo del tutorial no debe llegar
 * al guardado. No recibe ni conserva la emoción registrada.
 */
export function notifyTutorialCheckinSaved(userId: string): void {
  try {
    tutorialSession.checkinSaved(userId);
  } catch {
    // El check-in ya está guardado; el tutorial queda como estaba.
  }
}
