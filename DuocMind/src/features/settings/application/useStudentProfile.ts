import { useEffect, useState } from 'react';
import { supabaseStudentProfileGateway } from '../infrastructure/supabaseStudentProfileGateway';
import type { StudentProfileDetails } from '../domain/studentProfile';
import { loadStudentProfile } from './studentProfile';

export interface StudentProfileState {
  profile: StudentProfileDetails | null;
  loading: boolean;
  failed: boolean;
}

/** Datos del estudiante con sesión para la pantalla «Mi perfil». */
export function useStudentProfile(): StudentProfileState {
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

  return state;
}
