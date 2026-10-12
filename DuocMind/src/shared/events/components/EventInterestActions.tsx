import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScalePress } from '@/shared/components/ScalePress';
import { fontFamily as font } from '@/shared/theme/typography';
import { canAddEvent, eventDateKey, eventIntervalLabel, registrationInfo, type InstitutionalEvent, type EventInterest } from '../domain/institutionalEvent';
import type { useEvents } from '../application/useEvents';
export function EventInterestActions({ event, interest, current, model, showAgenda = true }: {
  event: InstitutionalEvent; interest?: EventInterest; current?: InstitutionalEvent; model: ReturnType<typeof useEvents>; showAgenda?: boolean;
}) {
  const router = useRouter();
  const changed = interest && current && (interest.event.startsAt !== current.startsAt || interest.event.endsAt !== current.endsAt || interest.event.location !== current.location);
  const unavailable = !!interest && !current;
  const registration = registrationInfo(current ?? event, model.now);
  return <View style={styles.container}>
    {changed && <View style={styles.change}>
      <Text style={styles.title}>Este evento cambió · Cambio pendiente</Text>
      <Text style={styles.body}>En tu agenda: {eventIntervalLabel(interest.event)} · {interest.event.location}</Text>
      <Text style={styles.body}>Nuevo: {eventIntervalLabel(current)} · {current.location}</Text>
      <Text style={styles.body}>Actualizar requiere conexión para verificar la versión vigente.</Text>
      {current.status !== 'cancelled' && <ScalePress style={[styles.button, (model.busy || model.snapshot?.offline) && styles.disabled]} disabled={model.busy || model.snapshot?.offline} onPress={() => void model.accept(current, interest.version)} accessibilityRole="button"><Text style={styles.buttonText}>Actualizar en mi agenda</Text></ScalePress>}
    </View>}
    {unavailable && <Text style={styles.body}>Información no disponible. Conservamos el evento que guardaste.</Text>}
    <View style={styles.row}>
      {interest ? <>
        <Text style={styles.saved}>✓ En mi agenda</Text>
        {showAgenda && <ScalePress style={[styles.button, styles.secondary]} onPress={() => router.push({ pathname: '/agenda', params: { date: eventDateKey(interest.event.startsAt) } })} accessibilityRole="button"><Text style={styles.secondaryText}>Ver en mi agenda</Text></ScalePress>}
        <ScalePress style={[styles.button, styles.secondary, model.busy && styles.disabled]} disabled={model.busy} onPress={() => void model.remove(event.id)} accessibilityRole="button" accessibilityLabel={`Quitar ${event.title} de mi agenda`}><Text style={styles.secondaryText}>Quitar de mi agenda</Text></ScalePress>
      </> : canAddEvent(event, model.now) && <ScalePress style={[styles.button, model.busy && styles.disabled]} disabled={model.busy} onPress={() => void model.add(event)} accessibilityRole="button"><Text style={styles.buttonText}>Agregar a mi agenda</Text></ScalePress>}
      {!unavailable && registration.state === 'open' && <ScalePress style={[styles.button, styles.secondary, (model.busy || model.snapshot?.offline) && styles.disabled]} disabled={model.busy || model.snapshot?.offline} onPress={() => void model.register(current ?? event)} accessibilityRole="button" accessibilityLabel="Inscribirme, abre un sitio externo"><Text style={styles.secondaryText}>Inscribirme ↗</Text></ScalePress>}
    </View>
    {registration.state === 'open' && !unavailable && <Text style={styles.body}>La inscripción se completa en un sitio externo. Agregar el evento a tu agenda guarda tu interés.</Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 12 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  button: { minHeight: 44, borderRadius: 14, backgroundColor: '#1a2b44', paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontFamily: font.bold, fontSize: 13 }, secondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc7b9' },
  secondaryText: { color: '#1a2b44', fontFamily: font.bold, fontSize: 13 }, disabled: { opacity: 0.5 },
  saved: { color: '#276346', fontFamily: font.bold, fontSize: 13 }, body: { color: '#465266', fontFamily: font.regular, fontSize: 12, lineHeight: 19 },
  change: { backgroundColor: '#f9eed2', padding: 14, borderRadius: 14, gap: 8 }, title: { color: '#725116', fontFamily: font.bold, fontSize: 13 },
});
