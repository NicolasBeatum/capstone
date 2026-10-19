import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckIcon, PlusIcon } from '@/shared/components/Icons';
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
    {interest ? <>
      <View style={styles.row}>
        <View style={styles.savedPill} accessibilityLabel="Este evento está en tu agenda">
          <CheckIcon size={18} color="#1d6148" /><Text style={styles.saved}>En mi agenda</Text>
        </View>
        <ScalePress style={[styles.button, styles.secondary, styles.removeButton, model.busy && styles.disabled]} disabled={model.busy} onPress={() => void model.remove(event.id)} accessibilityRole="button" accessibilityLabel={`Quitar ${event.title} de mi agenda`}><Text style={styles.secondaryText}>Quitar</Text></ScalePress>
      </View>
      {showAgenda && <ScalePress style={[styles.button, styles.secondary]} onPress={() => router.push({ pathname: '/agenda', params: { date: eventDateKey(interest.event.startsAt) } })} accessibilityRole="button"><Text style={styles.secondaryText}>Ver en mi agenda</Text></ScalePress>}
    </> : canAddEvent(event, model.now) && <ScalePress style={[styles.button, model.busy && styles.disabled]} disabled={model.busy} onPress={() => void model.add(event)} accessibilityRole="button" accessibilityLabel={`Agregar ${event.title} a mi agenda`}><PlusIcon size={20} color="#f2c14e" /><Text style={styles.buttonText}>Agregar a mi agenda</Text></ScalePress>}
    {!unavailable && registration.state === 'open' && <ScalePress style={[styles.button, styles.secondary, (model.busy || model.snapshot?.offline) && styles.disabled]} disabled={model.busy || model.snapshot?.offline} onPress={() => void model.register(current ?? event)} accessibilityRole="button" accessibilityLabel="Inscribirme, abre un sitio externo"><Text style={styles.secondaryText}>Inscribirme ↗</Text></ScalePress>}
    {registration.state === 'open' && !unavailable && <Text style={styles.body}>La inscripción se completa en un sitio externo. Agregar el evento a tu agenda guarda tu interés.</Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 12 }, row: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  // Botones de ancho completo: una sola acción principal por fila, fácil de tocar.
  button: { minHeight: 52, borderRadius: 26, backgroundColor: '#1a2b44', paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontFamily: font.extraBold, fontSize: 15 }, secondary: { backgroundColor: '#fffaf0', borderWidth: 1.5, borderColor: '#d9d1b8' },
  secondaryText: { color: '#1a2b44', fontFamily: font.extraBold, fontSize: 15 }, disabled: { opacity: 0.5 },
  removeButton: { paddingHorizontal: 26 },
  savedPill: { flex: 1, minHeight: 52, borderRadius: 26, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#dcefe3', borderWidth: 1.5, borderColor: '#b9e0c9' },
  saved: { color: '#1d6148', fontFamily: font.extraBold, fontSize: 15 }, body: { color: '#465266', fontFamily: font.regular, fontSize: 12, lineHeight: 19 },
  change: { backgroundColor: '#f9eed2', padding: 14, borderRadius: 14, gap: 8 }, title: { color: '#725116', fontFamily: font.bold, fontSize: 13 },
});
