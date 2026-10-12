import { createContext } from 'react';
import type { EventService } from './eventService';
export const EventServiceContext = createContext<EventService | null>(null);
