import { Text, View } from 'react-native';
import { PlusIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import type { PendingProjection } from '../../domain/pendingActivities';
import { pendingStyles as s } from '../../screens/PendingScreen.styles';

/** Título, resumen dinámico, botón «Nueva» y el progreso de la semana. */
export function PendingSummary({ summary, week, disabled, onNew }: {
  summary: string | null;
  week: PendingProjection['week'];
  disabled: boolean;
  onNew: () => void;
}) {
  return (
    <>
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={s.title} accessibilityRole='header'>Pendientes</Text>
          {summary && <Text style={s.summary}>{summary}</Text>}
        </View>
        <ScalePress
          style={[s.newButton, disabled && s.disabled]}
          disabled={disabled}
          onPress={onNew}
          accessibilityRole='button'
          accessibilityLabel='Nueva actividad'
          accessibilityState={{ disabled }}
        >
          <PlusIcon size={16} color='#fff' />
          <Text style={s.newText}>Nueva</Text>
        </ScalePress>
      </View>
      {week && (
        <Reveal style={[s.card, s.weekCard]}>
          <View style={s.weekHeader}>
            <Text style={s.weekTitle}>Esta semana</Text>
            <Text style={s.weekCount}>{week.done} de {week.total} hechas</Text>
          </View>
          <View
            style={s.track}
            accessibilityRole='progressbar'
            accessibilityLabel='Actividades de esta semana hechas'
            accessibilityValue={{ min: 0, max: week.total, now: week.done }}
          >
            <View style={[s.fill, { width: `${Math.round((week.done / week.total) * 100)}%` }]} />
          </View>
        </Reveal>
      )}
    </>
  );
}
