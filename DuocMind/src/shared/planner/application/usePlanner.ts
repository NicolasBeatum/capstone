import { useCallback, useContext } from 'react';
import { useFocusEffect } from 'expo-router';
import { PlannerContext } from './plannerContext';
export function usePlanner() {
  const model = useContext(PlannerContext);
  if (!model) throw new Error('No se pudo iniciar la agenda.');
  const refresh = model.refresh;
  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));
  return model;
}

export type { PlannerModel } from './plannerContext';
