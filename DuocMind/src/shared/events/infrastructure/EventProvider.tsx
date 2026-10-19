import type { ReactNode } from 'react';
import { EventServiceContext } from '../application/eventContext';
import { eventService } from './eventRuntime';
export function EventProvider({ children }: { children: ReactNode }) {
  return <EventServiceContext.Provider value={eventService}>{children}</EventServiceContext.Provider>;
}
