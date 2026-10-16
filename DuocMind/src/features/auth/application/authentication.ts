export interface StudentProfileInput {
  rut: string;
  firstName: string;
  lastName: string;
}

export interface AuthGateway {
  register(email: string, password: string): Promise<boolean>;
  signIn(email: string, password: string): Promise<void>;
  getCurrentUserId(): Promise<string | null>;
  hasStudentProfile(): Promise<boolean>;
  hasCachedStudentProfile(): Promise<boolean>;
  createStudentProfile(profile: StudentProfileInput): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  deleteCurrentAccount(): Promise<void>;
}

export interface AccountDeletionSteps {
  clearLocalData(): Promise<void>;
  deleteRemoteAccount(): Promise<void>;
  clearLocalSession(): Promise<void>;
}

export type LoginDestination = 'profile' | 'dashboard';
export type RegistrationDestination = 'profile' | 'confirm-email';

export async function registerAccount(
  email: string,
  password: string,
  gateway: AuthGateway,
): Promise<RegistrationDestination> {
  const sessionCreated = await gateway.register(email.trim(), password);
  return sessionCreated ? 'profile' : 'confirm-email';
}

export async function loginAccount(
  email: string,
  password: string,
  gateway: AuthGateway,
): Promise<LoginDestination> {
  await gateway.signIn(email.trim(), password);
  return (await gateway.hasStudentProfile()) ? 'dashboard' : 'profile';
}

export async function completeStudentProfile(
  profile: StudentProfileInput,
  gateway: AuthGateway,
): Promise<void> {
  const normalizedProfile = {
    rut: profile.rut.trim(),
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
  };

  if (!normalizedProfile.rut || !normalizedProfile.firstName || !normalizedProfile.lastName) {
    throw new Error('Completa el RUT, nombre y apellido.');
  }

  await gateway.createStudentProfile(normalizedProfile);
}

export async function deleteStudentAccount(gateway: AuthGateway): Promise<void> {
  await gateway.deleteCurrentAccount();
}

export async function completeAccountDeletion(steps: AccountDeletionSteps): Promise<void> {
  await steps.clearLocalData();
  await steps.deleteRemoteAccount();
  await steps.clearLocalSession();
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña no válidos.',
  email_not_confirmed: 'Confirma tu correo antes de iniciar sesión.',
  weak_password: 'La contraseña no cumple los requisitos de seguridad.',
  over_email_send_rate_limit: 'Se enviaron demasiados correos. Espera unos minutos e inténtalo de nuevo.',
  over_request_rate_limit: 'Hiciste demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  email_address_invalid: 'Ese correo no es válido. Revisa que esté bien escrito.',
  email_address_not_authorized: 'Este correo no puede recibir mensajes de la aplicación todavía.',
  signup_disabled: 'El registro de cuentas no está disponible por ahora.',
  user_already_exists: 'Ya existe una cuenta con ese correo. Inicia sesión.',
  // Postgres: violación de unicidad. En el perfil solo puede ser el RUT o la cuenta.
  '23505': 'Ya existe un perfil con ese RUT o para esta cuenta.',
};

function isNetworkError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { name, message, status } = error as { name?: unknown; message?: unknown; status?: unknown };
  return (
    name === 'AuthRetryableFetchError' ||
    status === 0 ||
    (typeof message === 'string' && /network request failed|failed to fetch/i.test(message))
  );
}

export function getAuthenticationErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const message = AUTH_ERROR_MESSAGES[String(error.code)];
    if (message) return message;
  }

  if (error instanceof Error && error.message === 'Completa el RUT, nombre y apellido.') {
    return error.message;
  }

  if (isNetworkError(error)) {
    return 'No hay conexión con el servidor. Revisa tu internet e inténtalo nuevamente.';
  }

  return 'No se pudo completar la operación. Inténtalo nuevamente en unos minutos.';
}