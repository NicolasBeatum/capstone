import type { PropsWithChildren } from 'react';
import { AgendaActivitiesContext } from '../application/useAgendaActivities';
import { deleteAgendaActivity, getAgendaActivities, saveAgendaActivity } from './agendaStorage';
const gateway = { load: getAgendaActivities, save: saveAgendaActivity, remove: deleteAgendaActivity };
export function AgendaProvider({ children }: PropsWithChildren) {
  return <AgendaActivitiesContext.Provider value={gateway}>{children}</AgendaActivitiesContext.Provider>;
}
