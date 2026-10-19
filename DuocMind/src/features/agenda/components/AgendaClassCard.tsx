import { Text, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import type { ClassOccurrence } from '@/shared/planner/domain/weeklySchedule';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
export function AgendaClassCard(
  { occurrence, onOpen }: { occurrence: ClassOccurrence; onOpen: () => void },
) {
  const { subject, block, state } = occurrence;
  return (
    <ScalePress
      style={s.card}
      onPress={onOpen}
      accessibilityRole='button'
      accessibilityLabel={`Ver bloques de ${subject.name}`}
    >
      <Text style={state === 'in-progress' ? s.pill : s.notice}>
        Clase{state === 'in-progress' ? ' · En curso' : state === 'ended' ? ' · Finalizada' : ''}
      </Text>
      <Text style={s.cardTitle}>{subject.name}</Text>
      {(subject.code || subject.section) && (
        <Text style={s.subtitle}>
          {[subject.code, subject.section ? `Sección ${subject.section}` : null].filter(Boolean)
            .join(' · ')}
        </Text>
      )}
      {block.room && <Text style={s.subtitle}>{block.room}</Text>}
      {block.teacher && <Text style={s.subtitle}>{block.teacher}</Text>}
      {state === 'in-progress' && (
        <View
          accessibilityRole='progressbar'
          accessibilityValue={{ min: 0, max: 100, now: Math.round(occurrence.progress) }}
        >
          <Text style={s.subtitle}>Termina en {occurrence.minutesLeft} min</Text>
        </View>
      )}
    </ScalePress>
  );
}
