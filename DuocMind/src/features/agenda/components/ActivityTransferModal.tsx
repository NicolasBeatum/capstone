import { useState } from 'react';
import { Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import type { PlannerModel } from '@/shared/planner/application/usePlanner';
import type { PersonalActivity } from '@/shared/planner/application/plannerStore';
import type { ActivityTransfer } from '@/shared/planner/application/personalActivities';
import { PlannerButton, PlannerField, PlannerModal, PlannerSegmented } from './PlannerControls';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';

export interface TransferDraft {
  request: ActivityTransfer;
  activities: PersonalActivity[];
}

/** Prepara una copia o un traslado con una operación nueva e idempotente. */
export function createTransferDraft(
  activities: PersonalActivity[],
  mode: ActivityTransfer['mode'],
  targetSemesterId: string | null,
): TransferDraft {
  return {
    activities,
    request: {
      requestId: Crypto.randomUUID(),
      mode,
      targetSemesterId,
      sources: activities.map((activity) => ({
        id: activity.id,
        version: activity.version,
        copyId: mode === 'copy' ? Crypto.randomUUID() : null,
        date: activity.date,
      })),
    },
  };
}

const MODES = [['copy', 'Copiar'], ['move', 'Mover']] as const;

export function ActivityTransferModal({ planner, draft, onClose, onDone }: {
  planner: PlannerModel;
  draft: TransferDraft;
  onClose: () => void;
  onDone: () => void;
}) {
  const [transfer, setTransfer] = useState(draft), [error, setError] = useState<string | null>(null);
  const semesters = planner.snapshot?.document.schedule.semesters ?? [];
  const request = transfer.request;
  const update = (patch: Partial<ActivityTransfer>) =>
    setTransfer({ ...transfer, request: { ...request, ...patch } });
  const setMode = (mode: ActivityTransfer['mode']) => {
    if (mode === request.mode) return;
    const next = createTransferDraft(transfer.activities, mode, request.targetSemesterId);
    // Conserva las fechas que la persona ya haya editado.
    setTransfer({
      ...next,
      request: {
        ...next.request,
        sources: next.request.sources.map((source, index) => ({
          ...source,
          date: request.sources[index].date,
        })),
      },
    });
  };
  return (
    <PlannerModal
      title={request.mode === 'copy' ? 'Copiar actividades' : 'Mover actividades'}
      busy={planner.busy}
      onClose={onClose}
    >
      <PlannerSegmented options={MODES} value={request.mode} onChange={setMode} />
      <Text style={s.notice}>
        {request.mode === 'copy'
          ? 'Se crearán copias pendientes y los originales se conservarán.'
          : 'Se cambiará la organización; las actividades conservarán su identidad y su estado.'}{' '}
        Las fechas se mantienen salvo que las edites aquí.
      </Text>
      <Text style={s.label}>Destino</Text>
      <View style={s.row}>
        <PlannerButton
          label='Generales'
          secondary={request.targetSemesterId !== null}
          selected={request.targetSemesterId === null}
          onPress={() => update({ targetSemesterId: null })}
        />
        {semesters.map((semester) => (
          <PlannerButton
            key={semester.id}
            label={semester.name}
            secondary={request.targetSemesterId !== semester.id}
            selected={request.targetSemesterId === semester.id}
            onPress={() => update({ targetSemesterId: semester.id })}
          />
        ))}
      </View>
      {request.sources.map((source, index) => (
        <PlannerField
          key={source.id}
          label={`Fecha de ${transfer.activities[index].title}`}
          maxLength={10}
          value={source.date}
          onChangeText={(date) =>
            update({
              sources: request.sources.map((s) => s.id === source.id ? { ...s, date } : s),
            })}
        />
      ))}
      {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
      <PlannerButton
        label={request.mode === 'copy' ? 'Confirmar copia' : 'Confirmar traslado'}
        disabled={planner.busy}
        onPress={() =>
          void planner.transfer(request).then(onDone).catch((e: unknown) =>
            setError(e instanceof Error ? e.message : 'No se pudo guardar.')
          )}
      />
    </PlannerModal>
  );
}
