import type { StudentProfileDetails } from '../domain/studentProfile.ts';

export interface StudentProfileGateway {
  /** Perfil de la cuenta con sesión; null sin sesión o sin perfil de estudiante. */
  fetchProfile(): Promise<StudentProfileDetails | null>;
}

export interface LoadedStudentProfile {
  profile: StudentProfileDetails | null;
  /** No se pudo leer el perfil (por ejemplo, sin conexión). */
  failed: boolean;
}

/** Carga el perfil para «Mi perfil». Nunca lanza. */
export async function loadStudentProfile(gateway: StudentProfileGateway): Promise<LoadedStudentProfile> {
  try {
    return { profile: await gateway.fetchProfile(), failed: false };
  } catch {
    return { profile: null, failed: true };
  }
}
