import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { subjectOptions, type SubjectOption } from '@/shared/subjects/domain/subject';
import { subjectCache } from '@/shared/subjects/infrastructure/subjectCacheStorage';
import { supabaseSubjectGateway } from '../infrastructure/supabaseSubjectGateway';
import { loadSubjectCatalog } from './subjectCatalog';

export interface SubjectCatalogState {
  options: SubjectOption[];
  loading: boolean;
  stale: boolean;
  failed: boolean;
}

/** Asignaturas de la cuenta; se actualizan cada vez que la pantalla toma el foco. */
export function useSubjectCatalog(): SubjectCatalogState {
  const [state, setState] = useState<SubjectCatalogState>({ options: [], loading: true, stale: false, failed: false });
  const request = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const sequence = ++request.current;
      void loadSubjectCatalog({ gateway: supabaseSubjectGateway, cache: subjectCache }).then((catalog) => {
        if (sequence !== request.current) return;
        setState({ options: subjectOptions(catalog.subjects), loading: false, stale: catalog.stale, failed: catalog.failed });
      });
      return () => {
        request.current += 1;
      };
    }, []),
  );

  return state;
}
