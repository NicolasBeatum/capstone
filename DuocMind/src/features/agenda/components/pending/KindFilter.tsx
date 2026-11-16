import { Text, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import type { KindFilter as Kind } from '../../domain/pendingActivities';
import { pendingStyles as s } from '../../screens/PendingScreen.styles';

const OPTIONS: readonly (readonly [Kind, string])[] = [
  ['all', 'Todas'],
  ['exam', 'Pruebas'],
  ['task', 'Tareas'],
  ['personal', 'Personales'],
];

/** Filtro por tipo, de selección única, con la cuenta de pendientes de cada uno. */
export function KindFilter({ value, counts, onChange }: {
  value: Kind;
  counts: Record<Kind, number>;
  onChange: (value: Kind) => void;
}) {
  return (
    <View style={s.chips} accessibilityLabel='Filtrar por tipo'>
      {OPTIONS.map(([kind, label]) => {
        const selected = value === kind;
        return (
          <ScalePress
            key={kind}
            style={[s.chip, selected && s.chipSelected]}
            onPress={() => onChange(kind)}
            accessibilityRole='button'
            accessibilityLabel={`${label}, ${counts[kind]} pendientes`}
            aria-pressed={selected}
            accessibilityState={{ selected }}
          >
            <Text style={[s.chipText, selected && s.chipTextSelected]}>
              {label} · {counts[kind]}
            </Text>
          </ScalePress>
        );
      })}
    </View>
  );
}
