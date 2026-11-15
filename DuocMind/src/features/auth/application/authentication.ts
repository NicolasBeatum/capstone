export interface StudentProfileInput {
  rut: string;
  firstName: string;
  lastName: string;
}

export interface AuthGateway {
  /** `careerId` viaja en los metadatos de la cuenta; el servidor lo asigna al crear el perfil. */
  register(email: string, password: string, careerId: number): Promise<boolean>;
  signIn(email: string, password: string): Promise<void>;
  getCurrentUserId(): Promise<string | null>;
  hasStudentProfile(): Promise<boolean>;
  hasCachedStudentProfile(): Promise<boolean>;
  createStudentProfile(profile: StudentProfileInput): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  /** Fecha en que se elimina la cuenta con sesión, o null si no hay una eliminación pendiente. */
  pendingAccountDeletion(): Promise<string | null>;
  /** Programa la eliminación (30 días) y cierra la sesión; los datos locales esperan el plazo. */
  scheduleAccountDeletion(): Promise<string>;
  cancelAccountDeletion(): Promise<void>;
}

export type LoginDestination = 'profile' | 'dashboard' | 'account-deletion';
export type RegistrationDestination = 'profile' | 'confirm-email';

export async function registerAccount(
  email: string,
  password: string,
  careerId: number,
  gateway: AuthGateway,
): Promise<RegistrationDestination> {
  const sessionCreated = await gateway.register(email.trim(), password, careerId);
  return sessionCreated ? 'profile' : 'confirm-email';
}

export async function loginAccount(
  email: string,
  password: string,
  gateway: AuthGateway,
): Promise<LoginDestination> {
  await gateway.signIn(email.trim(), password);
  // Con una eliminación pendiente se ofrece cancelarla antes de entrar.
  if (await gateway.pendingAccountDeletion()) return 'account-deletion';
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


export function getAuthenticationErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    if (code === 'invalid_credentials') return 'Correo o contraseña no válidos.';
    if (code === 'email_not_confirmed') return 'Confirma tu correo antes de iniciar sesión.';
    if (code === 'weak_password') return 'La contraseña no cumple los requisitos de seguridad.';
  }

  if (error instanceof Error && error.message === 'Completa el RUT, nombre y apellido.') {
    return error.message;
  }

  return 'No se pudo completar la operación. Revisa tu conexión e inténtalo nuevamente.';
}