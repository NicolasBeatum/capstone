import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { LiquidBackground } from '@/shared/components/Glass';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { BottomNav } from '@/shared/components/BottomNav';
import { type PlannerModel, usePlanner } from '@/shared/planner/application/usePlanner';
import { ACTIVITY_LABELS, type PersonalActivity } from '@/shared/planner/application/plannerStore';
import type { ActivityTransfer } from '@/shared/planner/application/personalActivities';
import type { LegacyCatalog } from '@/shared/planner/application/legacyActivities';
import { civilNow } from '@/shared/planner/domain/weeklySchedule';
import { personalActivityEnd } from '@/shared/planner/domain/personalActivityTime';
import { PlannerButton, PlannerField, PlannerModal } from '../components/PlannerControls';
import { PersonalActivityForm } from '../components/PersonalActivityForm';
import { scheduleStyles as s } from './ScheduleScreen.styles';
export default function PersonalActivitiesScreen() {
  const planner = usePlanner();
  const session = planner.snapshot?.session;
  return (
    <PersonalActivitiesScreenContent
      key={session ? `${session.userId}:${session.generation}` : 'signed-out'}
      planner={planner}
    />
  );
}
function PersonalActivitiesScreenContent({ planner }: { planner: PlannerModel }) {
  const router = useRouter(), document = planner.snapshot?.document, doc = document?.working;
  const [form, setForm] = useState<{ activity?: PersonalActivity } | null>(null),
    [selected, setSelected] = useState<Record<string, number>>({}),
    [filter, setFilter] = useState<string | null>('all');
  const [transfer, setTransfer] = useState<
      { request: ActivityTransfer; activities: PersonalActivity[] } | null
    >(null),
    [deleting, setDeleting] = useState<PersonalActivity | null>(null),
    [error, setError] = useState<string | null>(null);
  const [legacy, setLegacy] = useState<'warning' | 'catalog' | null>(null),
    [catalog, setCatalog] = useState<LegacyCatalog | null>(null),
    [recover, setRecover] = useState<string[]>([]);
  const activities = [...(document?.activities ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id)
  );
  const choose = (activity: PersonalActivity) =>
    setSelected((previous) => {
      const next = { ...previous };
      if (activity.id in next) delete next[activity.id];
      else next[activity.id] = activity.version;
      return next;
    });
  const prepare = (mode: 'copy' | 'move') => {
    try {
      const values = Object.keys(selected).map((id) => {
        const activity = activities.find((a) => a.id === id && a.version === selected[id]);
        if (!activity) throw new Error('Una actividad cambió. Revisa tu selección.');
        return activity;
      });
      if (!values.length) return;
      setError(null);
      setTransfer({
        activities: values,
        request: {
          requestId: Crypto.randomUUID(),
          mode,
          targetSemesterId: doc?.activeSemesterId ?? null,
          sources: values.map((activity) => ({
            id: activity.id,
            version: activity.version,
            copyId: mode === 'copy' ? Crypto.randomUUID() : null,
            date: activity.date,
          })),
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revisa tu selección.');
    }
  };
  const failure = (e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo guardar.');
  return (
    <View style={s.page}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Text style={s.title} accessibilityRole='header'>Mis actividades</Text>
          <PlannerButton
            label='Nueva actividad'
            disabled={!document || planner.busy}
            onPress={() => setForm({})}
          />
        </View>
        <Text style={s.subtitle}>
          Pruebas, tareas y actividades personales. Se guardan solo en este dispositivo.
        </Text>
        <View style={s.row}>
          <PlannerButton secondary label='Ver agenda' onPress={() => router.push('/agenda')} />
          <PlannerButton secondary label='Mis horarios' onPress={() => router.push('/schedule')} />
        </View>
        {planner.loading && <GotaLoader text='Cargando tus actividades…' />}
        {planner.error && <Text style={s.error} accessibilityRole='alert'>{planner.error}</Text>}
        <Text style={s.label}>Organización</Text>
        <View style={s.row}>
          <PlannerButton
            label='Todas'
            secondary={filter !== 'all'}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <PlannerButton
            label='Generales'
            secondary={filter !== null}
            selected={filter === null}
            onPress={() => setFilter(null)}
          />
          {doc?.semesters.map((semester) => (
            <PlannerButton
              key={semester.id}
              label={semester.name}
              secondary={filter !== semester.id}
              selected={filter === semester.id}
              onPress={() => setFilter(semester.id)}
            />
          ))}
        </View>
        {Object.keys(selected).length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>{Object.keys(selected).length} seleccionadas</Text>
            <View style={s.row}>
              <PlannerButton label='Copiar a otro semestre' onPress={() => prepare('copy')} />
              <PlannerButton
                secondary
                label='Mover a otro semestre'
                onPress={() => prepare('move')}
              />
              <PlannerButton secondary label='Quitar selección' onPress={() => setSelected({})} />
            </View>
          </View>
        )}
        {error && !transfer && !deleting && !legacy && (
          <Text style={s.error} accessibilityRole='alert'>{error}</Text>
        )}
        {!planner.loading &&
          !activities.filter((activity) => filter === 'all' || activity.semesterId === filter)
            .length &&
          (
            <View style={s.card}>
              <Text style={s.cardTitle}>Sin actividades aquí</Text>
              <Text style={s.subtitle}>
                Puedes crear una actividad general o asociarla a un semestre para organizarla.
              </Text>
            </View>
          )}
        {activities.filter((activity) => filter === 'all' || activity.semesterId === filter).map(
          (activity) => (
            <View key={activity.id} style={[s.card, activity.id in selected && s.selected]}>
              <Text style={s.pill}>
                {ACTIVITY_LABELS[activity.kind]} · {activity.semesterName ?? 'General'}
              </Text>
              <Text style={s.cardTitle}>{activity.title}</Text>
              <Text style={s.subtitle}>
                {activity.date} ·{' '}
                {activity.time}–{personalActivityEnd(activity.time, activity.endTime)}
                {activity.subjectName ? ` · ${activity.subjectName}` : ''}
              </Text>
              {activity.semesterId && !doc?.semesters.some((semester) =>
                semester.id === activity.semesterId
              ) && (
                <Text style={s.notice}>Semestre no disponible. La actividad sigue guardada.</Text>
              )}
              <View style={s.row}>
                <PlannerButton
                  secondary
                  selected={activity.id in selected}
                  label={`${
                    activity.id in selected ? 'Quitar selección de' : 'Seleccionar'
                  } ${activity.title} · ${activity.semesterName ?? 'General'}`}
                  onPress={() =>
                    choose(activity)}
                />
                <PlannerButton
                  secondary
                  label={`Editar actividad ${activity.title}`}
                  onPress={() => setForm({ activity })}
                />
                <PlannerButton
                  danger
                  label={`Eliminar actividad ${activity.title}`}
                  onPress={() => {
                    setDeleting(activity);
                    setError(null);
                  }}
                />
              </View>
            </View>
          ),
        )}
        <PlannerButton
          secondary
          label='Recuperar actividades anteriores'
          onPress={() => {
            setLegacy('warning');
            setCatalog(null);
            setRecover([]);
            setError(null);
          }}
        />
      </ScrollView>
      <BottomNav currentTab='pending' />
      {form && (
        <PersonalActivityForm
          planner={planner}
          date={civilNow(planner.now).date}
          activity={form.activity}
          onClose={() => setForm(null)}
        />
      )}
      {deleting && (
        <PlannerModal
          title='Eliminar actividad'
          busy={planner.busy}
          onClose={() => setDeleting(null)}
        >
          <Text style={s.subtitle}>Se eliminará {deleting.title} de este dispositivo.</Text>
          {error && <Text style={s.error}>{error}</Text>}
          <PlannerButton
            danger
            label='Confirmar eliminación de actividad'
            disabled={planner.busy}
            onPress={() =>
              void planner.removeActivity(deleting.id, deleting.version).then(() => {
                setDeleting(null);
                setSelected({});
              }).catch(failure)}
          />
        </PlannerModal>
      )}
      {transfer && (
        <PlannerModal
          title={transfer.request.mode === 'copy' ? 'Copiar actividades' : 'Mover actividades'}
          busy={planner.busy}
          onClose={() => setTransfer(null)}
        >
          <Text style={s.notice}>
            {transfer.request.mode === 'copy'
              ? 'Se crearán copias y los originales se conservarán.'
              : 'Se cambiará la organización; las actividades conservarán su identidad.'}{' '}
            Las fechas se mantienen salvo que las edites aquí.
          </Text>
          <Text style={s.label}>Destino</Text>
          <View style={s.row}>
            <PlannerButton
              label='Generales'
              secondary={transfer.request.targetSemesterId !== null}
              selected={transfer.request.targetSemesterId === null}
              onPress={() =>
                setTransfer({
                  ...transfer,
                  request: { ...transfer.request, targetSemesterId: null },
                })}
            />
            {doc?.semesters.map((semester) => (
              <PlannerButton
                key={semester.id}
                label={semester.name}
                secondary={transfer.request.targetSemesterId !== semester.id}
                selected={transfer.request.targetSemesterId === semester.id}
                onPress={() =>
                  setTransfer({
                    ...transfer,
                    request: { ...transfer.request, targetSemesterId: semester.id },
                  })}
              />
            ))}
          </View>
          {transfer.request.sources.map((source, index) => (
            <PlannerField
              key={source.id}
              label={`Fecha de ${transfer.activities[index].title}`}
              maxLength={10}
              value={source.date}
              onChangeText={(date) =>
                setTransfer({
                  ...transfer,
                  request: {
                    ...transfer.request,
                    sources: transfer.request.sources.map((s) =>
                      s.id === source.id ? { ...s, date } : s
                    ),
                  },
                })}
            />
          ))}
          {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
          <PlannerButton
            label='Confirmar traslado o copia'
            disabled={planner.busy}
            onPress={() =>
              void planner.transfer(transfer.request).then(() => {
                setTransfer(null);
                setSelected({});
                setError(null);
              }).catch(failure)}
          />
        </PlannerModal>
      )}
      {legacy && (
        <PlannerModal
          title='Recuperar actividades anteriores'
          busy={planner.busy}
          onClose={() => setLegacy(null)}
        >
          {legacy === 'warning'
            ? (
              <>
                <Text style={s.notice}>
                  El almacenamiento anterior no identifica a su propietario. Puede contener
                  actividades de otra cuenta que usó este dispositivo. Continúa solo para
                  identificar y recuperar tus propias actividades; el origen se conservará.
                </Text>
                <PlannerButton
                  label='Entiendo, revisar actividades'
                  disabled={planner.busy}
                  onPress={() =>
                    void planner.listLegacy(true).then((result) => {
                      setCatalog(result);
                      setLegacy('catalog');
                    }).catch(failure)}
                />
              </>
            )
            : (
              <>
                {catalog?.invalidCount !== 0 && (
                  <Text style={s.notice}>
                    {catalog?.invalidCount}{' '}
                    registros no se pueden recuperar porque sus datos no son válidos.
                  </Text>
                )}
                {catalog?.entries.filter((entry) => !document?.imports.includes(entry.fingerprint))
                  .map((entry) => (
                    <PlannerButton
                      key={entry.fingerprint}
                      label={`${
                        recover.includes(entry.fingerprint) ? 'Seleccionada' : 'Recuperar'
                      }: ${entry.activity.title} · ${entry.activity.date}`}
                      secondary={!recover.includes(entry.fingerprint)}
                      selected={recover.includes(entry.fingerprint)}
                      onPress={() =>
                        setRecover((previous) =>
                          previous.includes(entry.fingerprint)
                            ? previous.filter((key) => key !== entry.fingerprint)
                            : [...previous, entry.fingerprint]
                        )}
                    />
                  ))}
                {!catalog?.entries.some((entry) =>
                  !document?.imports.includes(entry.fingerprint)
                ) && (
                  <Text style={s.subtitle}>
                    No hay actividades anteriores pendientes de recuperar.
                  </Text>
                )}
                <PlannerButton
                  label='Guardar selección en mi cuenta local'
                  disabled={!recover.length || planner.busy}
                  onPress={() =>
                    void planner.importLegacy(
                      (catalog?.entries ?? []).filter((entry) =>
                        recover.includes(entry.fingerprint)
                      ).map((entry) => ({ entry, newId: Crypto.randomUUID() })),
                    ).then(() => {
                      setLegacy(null);
                      setRecover([]);
                      setError(null);
                    }).catch(failure)}
                />
              </>
            )}
          {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
        </PlannerModal>
      )}
    </View>
  );
}
