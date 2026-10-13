import NetInfo from '@react-native-community/netinfo';
import { Linking } from 'react-native';
import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { EventService } from '../application/eventService';
import { parseCatalog, UUID_PATTERN } from '../domain/institutionalEvent';
import { eventSessionGateway } from './eventSessionGateway';
import { getEventStore } from './eventStorage';
export const eventService = new EventService({
  catalog: { async load(eventId) {
    if (eventId && !UUID_PATTERN.test(eventId)) throw new Error('El evento no es válido.');
    if ((await NetInfo.fetch()).isConnected === false) throw new Error('Sin conexión.');
    const { data, error } = await getSupabaseClient().rpc('get_student_events', { p_event_id: eventId ?? null });
    if (error) throw new Error('No se pudieron descargar los eventos.');
    return parseCatalog(data);
  } },
  session: eventSessionGateway, store: getEventStore,
  clock: { now: () => new Date() }, link: { open: (url) => Linking.openURL(url) },
});
