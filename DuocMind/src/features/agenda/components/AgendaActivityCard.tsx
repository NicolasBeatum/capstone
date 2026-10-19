import { StyleSheet, Text, View } from 'react-native';
import { CloseIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { fontFamily as font } from '@/shared/theme/typography';
import { ACTIVITY_LABELS, type PersonalActivity } from '@/shared/planner/application/plannerStore';

interface AgendaActivityCardProps {
  activity: PersonalActivity;
  inProgress: boolean;
  onRemove: () => void;
  onOpen: () => void;
}

/** Actividad personal: barra dorada, o verde mientras ocurre; la X la elimina. */
export function AgendaActivityCard({ activity, inProgress, onRemove, onOpen }: AgendaActivityCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.bar, inProgress && styles.barActive]} />
      <ScalePress style={styles.body} onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Editar actividad ${activity.title}`}><Text style={styles.subject}>{ACTIVITY_LABELS[activity.kind]} · Solo en este dispositivo</Text>
        {inProgress ? <View style={styles.nowPill}><Text style={styles.nowText}>Ahora</Text></View> : null}
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={activity.subjectName ? styles.subject : styles.noSubject}>{activity.subjectName ?? 'Sin ramo'}</Text>{activity.semesterName&&<Text style={styles.subject}>{activity.semesterName}</Text>}
      </ScalePress>
      <ScalePress style={styles.close} onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Eliminar ${activity.title}`}>
        <CloseIcon size={14} color="#a39b8b" />
      </ScalePress>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fffaf0', borderRadius: 20, borderWidth: 1, borderColor: '#e6dfc9', paddingVertical: 14, paddingLeft: 14, paddingRight: 14 },
  bar: { alignSelf: 'stretch', width: 4, borderRadius: 2, backgroundColor: '#f2c14e' },
  barActive: { backgroundColor: '#10a875' },
  body: { flex: 1, gap: 3, paddingRight: 34 },
  nowPill: { alignSelf: 'flex-start', borderRadius: 10, backgroundColor: '#d6f0e5', paddingHorizontal: 9, paddingVertical: 3, marginBottom: 2 },
  nowText: { color: '#087a55', fontSize: 12, fontFamily: font.extraBold },
  title: { color: '#1a2b44', fontSize: 16, lineHeight: 21, fontFamily: font.extraBold },
  subject: { color: '#596273', fontSize: 13, fontFamily: font.semiBold },
  noSubject: { color: '#8a8272', fontSize: 13, fontFamily: font.regular, fontStyle: 'italic' },
  // Solo el trazo, sin fondo: el área táctil sigue siendo de 44 px.
  close: { position: 'absolute', top: 6, right: 6, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
