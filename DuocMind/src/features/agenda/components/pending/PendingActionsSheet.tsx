import { Text, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import { ACTIVITY_LABELS } from '@/shared/planner/application/plannerStore';
import { personalActivityEnd } from '@/shared/planner/domain/personalActivityTime';
import { longDayLabel, type PendingItem } from '../../domain/pendingActivities';
import { PlannerModal } from '../PlannerControls';
import { kindColors, pendingStyles as s } from '../../screens/PendingScreen.styles';

export interface PendingActions {
  toggleDone(): void;
  edit(): void;
  openAgenda(): void;
  transfer(): void;
  selectMany(): void;
  remove(): void;
}

/** Hoja inferior con todo lo que se puede hacer con una actividad. */
export function PendingActionsSheet({ item, busy, semesterMissing, error, actions, onClose }: {
  item: PendingItem;
  busy: boolean;
  semesterMissing: boolean;
  error: string | null;
  actions: PendingActions;
  onClose: () => void;
}) {
  const { activity } = item, done = !!activity.doneAt;
  const kind = [ACTIVITY_LABELS[activity.kind], activity.subjectName].filter(Boolean).join(' · ');
  const detail = [
    longDayLabel(activity.date),
    `${activity.time}–${personalActivityEnd(activity.time, activity.endTime)}`,
    done ? 'Hecha' : item.countdown,
  ].join(' · ');
  const options: [string, () => void][] = [
    ['Editar', actions.edit],
    ['Ver ese día en la agenda', actions.openAgenda],
    ['Copiar o mover a otro semestre', actions.transfer],
    ['Seleccionar varias', actions.selectMany],
  ];
  return (
    <PlannerModal sheet title={activity.title} busy={busy} onClose={onClose}>
      <View style={s.sheetKind}>
        <View style={[s.dot, { backgroundColor: kindColors[activity.kind].dot }]} />
        <Text style={[s.sheetKindText, { color: kindColors[activity.kind].text }]}>
          {kind.toUpperCase()}
        </Text>
      </View>
      <Text style={s.sheetDate}>{detail}</Text>
      <Text style={s.sheetNotice}>
        {activity.semesterName ?? 'General'}
        {semesterMissing ? ' · Semestre no disponible; la actividad sigue guardada.' : ''}
      </Text>
      <ScalePress
        style={[s.primary, busy && s.disabled]}
        disabled={busy}
        onPress={actions.toggleDone}
        accessibilityRole='button'
        accessibilityState={{ disabled: busy }}
      >
        <Text style={s.primaryText}>{done ? 'Marcar como pendiente' : 'Marcar como hecha'}</Text>
      </ScalePress>
      {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
      <View style={s.actions}>
        {options.map(([label, onPress], index) => (
          <ScalePress
            key={label}
            style={[s.action, index > 0 && s.rowDivider]}
            onPress={onPress}
            disabled={busy}
            accessibilityRole='button'
          >
            <Text style={s.actionText}>{label}</Text>
          </ScalePress>
        ))}
      </View>
      <ScalePress
        style={s.dangerAction}
        onPress={actions.remove}
        disabled={busy}
        accessibilityRole='button'
      >
        <Text style={s.dangerText}>Eliminar actividad</Text>
      </ScalePress>
    </PlannerModal>
  );
}
