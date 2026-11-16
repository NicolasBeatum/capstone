import { Text, useWindowDimensions, View } from 'react-native';
import { CheckIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { ACTIVITY_LABELS } from '@/shared/planner/application/plannerStore';
import type { PendingItem } from '../../domain/pendingActivities';
import { kindColors, pendingStyles as s } from '../../screens/PendingScreen.styles';

export type RowMode = 'pending' | 'done' | 'select';

/**
 * Fila de un pendiente: el círculo marca o desmarca y el resto abre las acciones.
 * En modo de selección, el círculo es una casilla y toda la fila selecciona.
 */
export function PendingRow({ item, mode, late = false, selected = false, divider, disabled, onToggle, onOpen }: {
  item: PendingItem;
  mode: RowMode;
  late?: boolean;
  selected?: boolean;
  divider: boolean;
  disabled: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { fontScale } = useWindowDimensions(), stacked = fontScale >= 1.3;
  const { activity } = item, done = mode === 'done' || (mode === 'select' && !!activity.doneAt);
  const select = mode === 'select';
  const meta = [ACTIVITY_LABELS[activity.kind], activity.subjectName].filter(Boolean).join(' · ');
  const checkLabel = select
    ? `Seleccionar ${activity.title}`
    : `Marcar ${activity.title} como ${done ? 'pendiente' : 'hecha'}`;
  const checked = select ? selected : done;
  return (
    <View style={[s.row, divider && s.rowDivider, select && selected && s.rowSelected]}>
      <ScalePress
        style={s.check}
        onPress={select ? onOpen : onToggle}
        disabled={disabled && !select}
        accessibilityRole='checkbox'
        accessibilityLabel={checkLabel}
        aria-checked={checked}
        accessibilityState={{ checked, disabled: disabled && !select }}
      >
        {select
          ? (
            <View style={[s.box, selected && s.boxChecked]}>
              {selected && <CheckIcon size={13} color='#fff' />}
            </View>
          )
          : (
            <View style={[s.circle, done && s.circleDone]}>
              {done && <CheckIcon size={13} color='#fff' />}
            </View>
          )}
      </ScalePress>
      <ScalePress
        style={[s.rowBody, stacked && s.rowBodyStacked]}
        onPress={onOpen}
        accessibilityRole='button'
        accessibilityLabel={item.a11y}
        accessibilityHint={select ? 'Selecciona o quita la actividad' : 'Abre las acciones'}
        accessibilityState={select ? { selected } : undefined}
      >
        <View style={s.rowText}>
          <Text style={done ? s.rowTitleDone : s.rowTitle}>{activity.title}</Text>
          <View style={s.meta}>
            <View style={[s.dot, { backgroundColor: kindColors[activity.kind].dot }]} />
            <Text style={s.metaText}>{meta}</Text>
          </View>
        </View>
        <View style={stacked ? s.whenStacked : s.when}>
          <Text style={[s.whenText, late && s.whenLate]}>{item.when}</Text>
          {!done && <Text style={s.countdown}>{item.countdown}</Text>}
        </View>
      </ScalePress>
    </View>
  );
}
