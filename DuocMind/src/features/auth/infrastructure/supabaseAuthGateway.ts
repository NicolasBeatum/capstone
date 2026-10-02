import { completeAccountDeletion, type AuthGateway, type StudentProfileInput } from '../application/authentication';
import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { deleteLocalCheckinData } from '@/features/emotional-checkin/infrastructure/encryptedCheckinDatabase';
import { platformSecureKeyValueStorage } from '@/shared/backend/infrastructure/platformSecureStorage';

const PROFILE_VERIFIED_KEY_PREFIX = 'duocmind.student-profile-verified.v1.';

function throwIfError(error: { code?: string } | null): void {
  if (error) throw error;
}

export const supabaseAuthGateway: AuthGateway = {
  async register(email, password) {
    const { data, error } = await getSupabaseClient().auth.signUp({ email, password });
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
      await platformSecureKeyValueStorage.deleteItem(`${PROFILE_VERIFIED_KEY_PREFIX}${userId}`);
    }
  },

  async deleteCurrentAccount() {
    const client = getSupabaseClient();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    throwIfError(sessionError);
    const userId = sessionData.session?.user.id;
    if (!userId) throw new Error('Inicia sesión para eliminar tu cuenta.');

    await completeAccountDeletion({
      clearLocalData: () => deleteLocalCheckinData(userId),
      deleteRemoteAccount: async () => {
        const { error } = await client.functions.invoke('delete-account', { body: {} });
        throwIfError(error);
      },
      clearLocalSession: async () => {
        const { error } = await client.auth.signOut({ scope: 'local' });
        throwIfError(error);
      },
    });
  },
};