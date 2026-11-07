import { Text, View } from 'react-native';
import { Reveal } from '@/shared/motion/Reveal';
import { ScalePress } from '@/shared/components/ScalePress';
import type { ScheduleSubject, WeeklyBlock } from '@/shared/planner/domain/schedule';
import { WEEKDAYS } from '@/shared/planner/domain/weeklySchedule';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
function Action({ label, a11yLabel, danger, onPress }: {
  label: string;
  a11yLabel: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <ScalePress
      style={s.linkAction}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={a11yLabel}
    >
      <Text style={[s.linkActionText, danger && s.dangerText]}>{label}</Text>
    </ScalePress>
  );
}
export function SubjectCard({ subject, blocks, index, onBlocks, onEdit, onRemove }: {
  subject: ScheduleSubject;
  blocks: WeeklyBlock[];
  index: number;
  onBlocks: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const sorted = [...blocks].sort((a, b) =>
    a.weekday - b.weekday || a.startsAt.localeCompare(b.startsAt)
  );
  return (
    <Reveal index={index}>
      <View style={s.card}>
        <Text style={s.cardTitle}>{subject.name}</Text>
        {(subject.code || subject.section) && (
          <Text style={s.subtitle}>
            {[subject.code, subject.section ? `Sección ${subject.section}` : null].filter(Boolean)
              .join(' · ')}
          </Text>
        )}
        {sorted.length
          ? (
            <View style={s.row}>
              {sorted.map((block) => (
                <Text key={block.id} style={s.blockChip}>
                  {WEEKDAYS[block.weekday - 1].slice(0, 3)} {block.startsAt}–{block.endsAt}
                </Text>
              ))}
            </View>
          )
          : <Text style={s.subtitle}>Sin bloques todavía</Text>}
        <View style={s.divider} />
        <View style={s.linkActions}>
          <Action
            label='Bloques'
            a11yLabel={`Bloques de ${subject.name}`}
            onPress={onBlocks}
          />
          <Action label='Editar' a11yLabel={`Editar ${subject.name}`} onPress={onEdit} />
          <Action
            danger
            label='Eliminar'
            a11yLabel={`Eliminar ${subject.name}`}
            onPress={onRemove}
          />
        </View>
      </View>
    </Reveal>
  );
}
