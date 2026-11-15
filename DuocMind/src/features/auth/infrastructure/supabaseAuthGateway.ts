import type { AuthGateway, StudentProfileInput } from '../application/authentication';
import { scheduleAccountDeletion } from '@/shared/deletion/application/scheduledDeletion';
import { supabaseDeletionGateway } from '@/shared/deletion/infrastructure/supabaseDeletionGateway';
import { purgeExpiredAccounts } from '@/shared/deletion/application/localDeletionSchedule';
import { localDeletionSchedule } from '@/shared/deletion/infrastructure/localDeletionScheduleStorage';
import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { deleteLocalCheckinData } from '@/features/emotional-checkin/infrastructure/encryptedCheckinDatabase';
import { platformSecureKeyValueStorage } from '@/shared/backend/infrastructure/platformSecureStorage';

import { deleteEventData } from '@/shared/events/infrastructure/eventStorage';
import { blockEventAccount } from '@/shared/events/infrastructure/eventSessionGateway';
import { deleteSubjectCache } from '@/shared/subjects/infrastructure/subjectCacheStorage';
import { deleteConsentData } from '@/shared/consents/infrastructure/consentStorage';
import { deleteLastStressTest } from '@/features/emotional-checkin/infrastructure/lastStressTestStorage';
import { deleteTutorialProgress } from '@/shared/tutorial/infrastructure/tutorialProgressStorage';
import { closePlannerData, deletePlannerData } from '@/shared/planner/infrastructure/plannerStorage';

const PROFILE_VERIFIED_KEY_PREFIX = 'duocmind.student-profile-verified.v1.';

function throwIfError(error: { code?: string } | null): void {
  if (error) throw error;
}

/** Borra todo lo que la cuenta guardó en este dispositivo. */
async function deleteAccountLocalData(userId: string): Promise<void> {
  const releaseEvents = blockEventAccount(userId);
  try {
    await deletePlannerData(userId);
    await deleteEventData(userId);
    await deleteLocalCheckinData(userId);
    await deleteTutorialProgress(userId);
    await deleteSubjectCache(userId);
    await deleteConsentData(userId);
    await deleteLastStressTest(userId);
    await platformSecureKeyValueStorage.deleteItem(`${PROFILE_VERIFIED_KEY_PREFIX}${userId}`);
  } finally {
    releaseEvents();
  }
}

/** Borra los datos locales de las cuentas cuya eliminación ya venció. Nunca lanza. */
export function purgeExpiredAccountData(): Promise<void> {
  return purgeExpiredAccounts({
    schedule: localDeletionSchedule,
    clearLocalData: deleteAccountLocalData,
    now: () => new Date(),
  });
}

export const supabaseAuthGateway: AuthGateway = {
  async register(email, password, careerId) {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: { data: { carrera_id: careerId } },
    });
    throwIfError(error);
    return data.session !== null;
  },

  async signIn(email, password) {
    const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
    throwIfError(error);
  },

  async getCurrentUserId() {
    const { data, error } = await getSupabaseClient().auth.getSession();
    throwIfError(error);
    return data.session?.user.id ?? null;
  },

  async hasStudentProfile() {
    const client = getSupabaseClient();
    const { data: userData, error: userError } = await client.auth.getUser();
    throwIfError(userError);
    if (!userData.user) return false;

    const { data, error } = await client
      .from('estudiante')
      .select('id_estudiante')
      .eq('auth_user_id', userData.user.id)
      .maybeSingle();
    throwIfError(error);
    if (data) {
      await platformSecureKeyValueStorage.setItem(`${PROFILE_VERIFIED_KEY_PREFIX}${userData.user.id}`, 'true');
    }
    return data !== null;
  },

  async hasCachedStudentProfile() {
    const { data, error } = await getSupabaseClient().auth.getSession();
    throwIfError(error);
    const userId = data.session?.user.id;
    if (!userId) return false;
    return (await platformSecureKeyValueStorage.getItem(`${PROFILE_VERIFIED_KEY_PREFIX}${userId}`)) === 'true';
  },

  async createStudentProfile(profile: StudentProfileInput) {
    const client = getSupabaseClient();
    const { data: userData, error: userError } = await client.auth.getUser();
    throwIfError(userError);
    if (!userData.user) throw new Error('No existe una sesión activa.');

    const { error } = await client.from('estudiante').insert({
      rut: profile.rut,
      primer_nombre: profile.firstName,
      primer_apellido: profile.lastName,
      correo: userData.user.email ?? null,
    });
    throwIfError(error);
    await platformSecureKeyValueStorage.setItem(`${PROFILE_VERIFIED_KEY_PREFIX}${userData.user.id}`, 'true');
  },

  async requestPasswordReset(email) {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email);
    throwIfError(error);
  },

  async signOut() {
    const { data } = await getSupabaseClient().auth.getSession();
    const userId = data.session?.user.id;
    const { error } = await getSupabaseClient().auth.signOut();
    throwIfError(error);
    if (userId) {
      await closePlannerData(userId);
      await platformSecureKeyValueStorage.deleteItem(`${PROFILE_VERIFIED_KEY_PREFIX}${userId}`);
    }
  },

  async pendingAccountDeletion() {
    return (await supabaseDeletionGateway.status()).account;
  },

  async scheduleAccountDeletion() {
    const client = getSupabaseClient();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    throwIfError(sessionError);
    const userId = sessionData.session?.user.id;
    if (!userId) throw new Error('Inicia sesión para eliminar tu cuenta.');

    return scheduleAccountDeletion({
      requestRemote: () => supabaseDeletionGateway.request('account'),
      rememberLocally: (executesAt) => localDeletionSchedule.remember(userId, executesAt),
      clearLocalSession: async () => {
        const { error } = await client.auth.signOut({ scope: 'local' });
        throwIfError(error);
        await closePlannerData(userId);
      },
    });
  },

  async cancelAccountDeletion() {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('Inicia sesión para cancelar la eliminación.');
    await supabaseDeletionGateway.cancel('account');
    await localDeletionSchedule.forget(userId);
  },
};
