import { useState } from 'react';
import { Text, View } from 'react-native';
import type { PlannerModel } from '@/shared/planner/application/plannerContext';
import type { ScheduleDocument } from '@/shared/planner/domain/schedule';
import { WEEKDAYS } from '@/shared/planner/domain/weeklySchedule';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { PlannerButton } from './PlannerControls';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
function Version({ title, document }: { title: string; document: ScheduleDocument }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      {document.semesters.map((semester) => (
        <View key={semester.id} style={{ gap: 6 }}>
          <Text style={s.label}>
            {semester.name}
            {document.activeSemesterId === semester.id ? ' · Activo' : ''}
          </Text>
          <Text style={s.subtitle}>
            {semester.startsOn ?? 'Sin inicio'} · {semester.endsOn ?? 'Sin término'}
          </Text>
          {document.subjects.filter((subject) => subject.semesterId === semester.id).map(
            (subject) => (
              <View key={subject.id}>
                <Text style={s.subtitle}>
                  {[subject.name, subject.code, subject.section].filter(Boolean).join(' · ')}
                </Text>
                {document.blocks.filter((block) => block.subjectId === subject.id).map((block) => (
                  <Text key={block.id} style={s.subtitle}>
                    {WEEKDAYS[block.weekday - 1]} {block.startsAt}–{block.endsAt}
                    {block.room ? ` · ${block.room}` : ''}
                    {block.teacher ? ` · ${block.teacher}` : ''}
                  </Text>
                ))}
              </View>
            ),
          )}
        </View>
      ))}
      {!document.semesters.length && <Text style={s.subtitle}>Sin semestres</Text>}
    </View>
  );
}
export function PlannerSyncNotice({ planner }: { planner: PlannerModel }) {
  const [expanded, setExpanded] = useState(false),
    [choice, setChoice] = useState<'local' | 'remote' | null>(null),
    [error, setError] = useState<string | null>(null);
  const doc = planner.snapshot?.document;
  const labels = {
    local: 'Guardado en este dispositivo',
    pending: 'Guardado aquí · Pendiente de sincronizar',
    synced: 'Horario sincronizado',
    conflict: 'Hay dos versiones del horario',
  };
  return (
    <View style={{ gap: 10 }}>
      {planner.loading && <GotaLoader text='Cargando tu horario…' />}
      {!planner.loading && doc && (
        <Text style={s.notice} accessibilityLiveRegion='polite'>
          {planner.syncing ? 'Sincronizando horario…' : labels[planner.status]}
        </Text>
      )}
      {(planner.error || planner.syncError) && (
        <>
          <Text accessibilityRole='alert' style={s.error}>
            {planner.error ?? planner.syncError}
          </Text>
          <PlannerButton label='Reintentar' secondary onPress={() => void planner.refresh()} />
        </>
      )}
      {doc?.conflict && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Revisa ambas versiones</Text>
          <Text style={s.subtitle}>
            Otro dispositivo cambió tu horario. Tus cambios locales siguen guardados. Las
            actividades personales se conservan con cualquier elección.
          </Text>
          <PlannerButton
            secondary
            label={expanded ? 'Ocultar versiones' : 'Comparar versiones'}
            onPress={() => setExpanded(!expanded)}
          />
          {expanded && (
            <>
              <Version title='En este dispositivo' document={doc.working} />
              <Version title='En tu cuenta' document={doc.conflict.document} />
              <Text style={s.notice}>
                Al conservar tus cambios también se mantienen los semestres que solo existen en la
                cuenta.
              </Text>
              <PlannerButton
                label='Conservar mis cambios'
                disabled={planner.busy}
                onPress={() => {
                  setChoice('local');
                  setError(null);
                }}
              />
              <PlannerButton
                secondary
                label='Usar la versión de la cuenta'
                disabled={planner.busy}
                onPress={() => {
                  setChoice('remote');
                  setError(null);
                }}
              />
            </>
          )}
          {choice && (
            <>
              <Text style={s.notice}>
                {choice === 'local'
                  ? 'Se guardará la versión local revisada y se conservarán los semestres añadidos en la cuenta.'
                  : 'Se reemplazará el horario local por la versión de la cuenta que acabas de revisar.'}
              </Text>
              <PlannerButton
                label='Confirmar elección'
                disabled={planner.busy}
                onPress={() => {
                  void planner.resolve(doc.working, doc.conflict!.revision, choice).then(() => {
                    setChoice(null);
                    setExpanded(false);
                  }).catch((e) =>
                    setError(e instanceof Error ? e.message : 'No se pudo resolver.')
                  );
                }}
              />
              <PlannerButton secondary label='Seguir revisando' onPress={() => setChoice(null)} />
            </>
          )}
          {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
        </View>
      )}
    </View>
  );
}
