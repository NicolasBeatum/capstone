/** Reglas puras del formulario de registro: contraseña, consentimientos y cuándo se puede enviar. */

export type PasswordRequirementId = 'length' | 'uppercase' | 'number' | 'symbol';

export interface PasswordRequirement {
  id: PasswordRequirementId;
  label: string;
  met: boolean;
}

/** Orden en que se muestran los requisitos, de izquierda a derecha y de arriba abajo. */
export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    { id: 'length', label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { id: 'uppercase', label: 'Una mayúscula', met: /[A-Z]/.test(password) },
    { id: 'number', label: 'Un número', met: /\d/.test(password) },
    { id: 'symbol', label: 'Un símbolo (@, #)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
}

export type StrengthLevel = 'weak' | 'progress' | 'almost' | 'strong';

export interface PasswordStrength {
  /** Requisitos cumplidos; también son los tramos de barra que se llenan. */
  metCount: number;
  total: number;
  level: StrengthLevel;
  /** Texto del estado: el color nunca es la única señal. */
  label: string;
}

const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  weak: 'Débil',
  progress: 'En progreso',
  almost: 'Casi lista',
  strong: 'Segura',
};

export function passwordStrength(password: string): PasswordStrength {
  const requirements = passwordRequirements(password);
  const metCount = requirements.filter((requirement) => requirement.met).length;
  const level: StrengthLevel =
    metCount === requirements.length ? 'strong' : metCount === 3 ? 'almost' : metCount === 2 ? 'progress' : 'weak';
  return { metCount, total: requirements.length, level, label: STRENGTH_LABELS[level] };
}

/** Consentimientos del registro: solo los términos son obligatorios; los demás parten desmarcados. */
export const REGISTER_CONSENT_LABELS = {
  terms: 'Acepto los términos de servicio y la política de privacidad',
  shareAnonymousData: 'Acepto compartir datos anónimos',
  allowEmergencyContact: 'Acepto que se me contacte en caso de emergencia',
} as const;

export interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  careerId: string | null;
  semester: number | null;
  acceptTerms: boolean;
}

/** Por qué no se puede crear la cuenta todavía: `terms` si falta la casilla obligatoria, `incomplete` si falta o falla algún dato. */
export type RegisterBlocker = 'terms' | 'incomplete' | null;

export function registerBlocker(state: RegisterFormState): RegisterBlocker {
  if (!state.acceptTerms) return 'terms';
  const complete =
    state.email.trim().length > 0 &&
    state.password.length > 0 &&
    state.password === state.confirmPassword &&
    passwordStrength(state.password).level === 'strong' &&
    state.careerId !== null &&
    state.semester !== null;
  return complete ? null : 'incomplete';
}

export function canSubmitRegistration(state: RegisterFormState): boolean {
  return registerBlocker(state) === null;
}

export const REGISTER_BLOCKER_HINTS: Record<Exclude<RegisterBlocker, null>, string> = {
  terms: 'Marca la casilla obligatoria de términos para crear tu cuenta.',
  incomplete: 'Completa tus datos para crear tu cuenta.',
};
