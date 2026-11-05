import { useCallback, useEffect, useState } from 'react';
import { supabaseStudentProfileEditor } from '../infrastructure/supabaseStudentProfileEditor';
import { supabaseStudentProfileGateway } from '../infrastructure/supabaseStudentProfileGateway';
import type { StudentProfileDetails } from '../domain/studentProfile';
import { parsePhone } from '../domain/studentProfileEdit';
import { loadStudentProfile } from './studentProfile';
import { saveEmail, saveName, savePhone, type EditResult } from './studentProfileEdit';

export interface StudentProfileState {
  profile: StudentProfileDetails | null;
  loading: boolean;
  failed: boolean;
}

export interface StudentProfile extends StudentProfileState {
  /** Guardan un dato y actualizan la pantalla sin volver a cargar el perfil. */
  updateName(names: string, surnames: string): Promise<EditResult>;
  updatePhone(phone: string): Promise<EditResult>;
  updateEmail(email: string): Promise<EditResult>;
}

/** Datos del estudiante con sesión para la pantalla «Mi perfil». */
export function useStudentProfile(): StudentProfile {
  const [state, setState] = useState<StudentProfileState>({ profile: null, loading: true, failed: false });

  useEffect(() => {
    let active = true;
    void loadStudentProfile(supabaseStudentProfileGateway).then((loaded) => {
      if (active) setState({ profile: loaded.profile, loading: false, failed: loaded.failed });
    });
    return () => {
      active = false;
    };
  }, []);

  const merge = useCallback((change: Partial<StudentProfileDetails>) => {
    setState((current) =>
      current.profile ? { ...current, profile: { ...current.profile, ...change } } : current,
    );
  }, []);

  const updateName = useCallback(
    async (names: string, surnames: string) => {
      const result = await saveName(supabaseStudentProfileEditor, names, surnames);
      if (result.ok) {
        const cleanNames = names.trim().split(/\s+/).join(' ');
        const cleanSurnames = surnames.trim().split(/\s+/).join(' ');
        merge({ names: cleanNames, surnames: cleanSurnames, fullName: `${cleanNames} ${cleanSurnames}` });
      }
      return result;
    },
    [merge],
  );

  const updatePhone = useCallback(
    async (phone: string) => {
      const result = await savePhone(supabaseStudentProfileEditor, phone);
      if (result.ok) {
        const parsed = parsePhone(phone);
        merge({ phone: parsed.ok ? parsed.value : null });
      }
      return result;
    },
    [merge],
  );

  // El correo de acceso no cambia en pantalla hasta que se confirma desde el enlace.
  const updateEmail = useCallback((email: string) => saveEmail(supabaseStudentProfileEditor, email), []);

  return { ...state, updateName, updatePhone, updateEmail };
}
