import { Text, View } from 'react-native';
import { CheckIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import type { SemesterFilter } from '../../domain/pendingActivities';
import { PlannerModal } from '../PlannerControls';
import { pendingColors, pendingStyles as s } from '../../screens/PendingScreen.styles';

const same = (a: SemesterFilter, b: SemesterFilter) =>
  a.kind === b.kind && (a.kind !== 'semester' || b.kind === 'semester' && a.id === b.id);

export function semesterFilterLabel(
  value: SemesterFilter,
  semesters: { id: string; name: string }[],
): string {
  if (value.kind === 'all') return 'todos los semestres';
  if (value.kind === 'general') return 'generales';
  return semesters.find((x) => x.id === value.id)?.name ?? 'todos los semestres';
}

/** Elige qué semestre se muestra: todos, solo generales o uno en particular. */
export function SemesterFilterSheet({ value, semesters, onChange, onClose }: {
  value: SemesterFilter;
  semesters: { id: string; name: string }[];
  onChange: (value: SemesterFilter) => void;
  onClose: () => void;
}) {
  const options: [SemesterFilter, string][] = [
    [{ kind: 'all' }, 'Todos los semestres'],
    [{ kind: 'general' }, 'Generales'],
    ...semesters.map((x): [SemesterFilter, string] => [{ kind: 'semester', id: x.id }, x.name]),
  ];
  return (
    <PlannerModal sheet title='Mostrar' busy={false} onClose={onClose}>
      <View style={s.actions}>
        {options.map(([option, label], index) => {
          const selected = same(option, value);
          return (
            <ScalePress
              key={option.kind === 'semester' ? option.id : option.kind}
              style={[s.option, index > 0 && s.rowDivider]}
              onPress={() => onChange(option)}
              accessibilityRole='radio'
              accessibilityLabel={label}
              aria-checked={selected}
              accessibilityState={{ checked: selected }}
            >
              <Text style={s.actionText}>{label}</Text>
              {selected && <CheckIcon size={18} color={pendingColors.ink} />}
            </ScalePress>
          );
        })}
      </View>
    </PlannerModal>
  );
}
