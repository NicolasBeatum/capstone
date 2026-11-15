import { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LiquidBackground } from '@/shared/components/Glass';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { BottomNav } from '@/shared/components/BottomNav';
import { ScalePress } from '@/shared/components/ScalePress';
import { motionDuration } from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';
import { type PlannerModel, usePlanner } from '@/shared/planner/application/usePlanner';
import type { PersonalActivity } from '@/shared/planner/application/plannerStore';
import { civilNow } from '@/shared/planner/domain/weeklySchedule';
import {
  type KindFilter as Kind,
  type PendingItem,
  projectPending,
  type SemesterFilter,
} from '../domain/pendingActivities';
import { PlannerButton, PlannerModal } from '../components/PlannerControls';
import { PersonalActivityForm } from '../components/PersonalActivityForm';
import {
  ActivityTransferModal,
  createTransferDraft,
  type TransferDraft,
} from '../components/ActivityTransferModal';
import { PendingSummary } from '../components/pending/PendingSummary';
import { KindFilter } from '../components/pending/KindFilter';
import { PendingGroup } from '../components/pending/PendingGroup';
import { PendingRow } from '../components/pending/PendingRow';
import { DoneSection } from '../components/pending/DoneSection';
import { PendingActionsSheet } from '../components/pending/PendingActionsSheet';
import {
  SemesterFilterSheet,
  semesterFilterLabel,
} from '../components/pending/SemesterFilterSheet';
import { SelectionBar } from '../components/pending/SelectionBar';
import { UndoToast } from '../components/pending/UndoToast';
import { scheduleStyles } from './ScheduleScreen.styles';
import { pendingStyles as s } from './PendingScreen.styles';

const ROW_EXIT = LayoutAnimation.create(
  motionDuration.rowExit,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity,
);
const message = (e: unknown) => e instanceof Error ? e.message : 'No se pudo guardar.';

export default function PersonalActivitiesScreen() {
  const planner = usePlanner();
  const session = planner.snapshot?.session;
  return (
    <PendingContent
      key={session ? `${session.userId}:${session.generation}` : 'signed-out'}
      planner={planner}
    />
  );
}

function PendingContent({ planner }: { planner: PlannerModel }) {
  const router = useRouter(), reduceMotion = useReducedMotion();
  const document = planner.snapshot?.document, schedule = document?.schedule;
  const semesters = useMemo(() => schedule?.semesters ?? [], [schedule]);
  const activities = useMemo(() => document?.activities ?? [], [document]);
  const [kind, setKind] = useState<Kind>('all'),
    [semester, setSemester] = useState<SemesterFilter>({ kind: 'all' }),
    [picker, setPicker] = useState(false);
  const [form, setForm] = useState<{ activity?: PersonalActivity } | null>(null),
    [sheet, setSheet] = useState<string | null>(null),
    [selection, setSelection] = useState<Record<string, number> | null>(null),
    [transfer, setTransfer] = useState<TransferDraft | null>(null),
    [deleting, setDeleting] = useState<PersonalActivity | null>(null);
  const [undo, setUndo] = useState<{ id: string; done: boolean; key: number } | null>(null),
    [error, setError] = useState<string | null>(null);

  // Un semestre que ya no existe vuelve a «todos» en lugar de dejar la lista vacía.
  const semesterId = semester.kind === 'semester' ? semester.id : null;
  const filter = useMemo<SemesterFilter>(() =>
    semester.kind === 'semester' && !semesters.some((x) => x.id === semesterId)
      ? { kind: 'all' }
      : semester, [semester, semesterId, semesters]);
  const view = useMemo(
    () => projectPending(activities, planner.now, { kind, semester: filter }),
    [activities, planner.now, kind, filter],
  );

  // La fila que se marca sale con un fundido corto cuando llegan los datos guardados.
  const animate = useRef(false), seen = useRef(activities);
  if (seen.current !== activities) {
    if (animate.current && !reduceMotion) LayoutAnimation.configureNext(ROW_EXIT);
    animate.current = false;
    seen.current = activities;
  }

  useFocusEffect(useCallback(() => () => {
    setSelection(null);
    setUndo(null);
  }, []));

  const setDone = (activity: PersonalActivity, done: boolean) => {
    setError(null);
    animate.current = true;
    return planner.setActivityDone(activity.id, activity.version, done).catch((e: unknown) => {
      animate.current = false;
      setError(message(e));
      throw e;
    });
  };
  const toggle = (activity: PersonalActivity) => {
    const done = !activity.doneAt;
    setSheet(null);
    void setDone(activity, done).then(
      () => setUndo({ id: activity.id, done, key: Date.now() }),
      () => undefined,
    );
  };
  const revert = () => {
    if (!undo) return;
    const current = activities.find((a) => a.id === undo.id);
    setUndo(null);
    if (current && !!current.doneAt === undo.done) {
      void setDone(current, !undo.done).catch(() => undefined);
    }
  };
  const hideUndo = useCallback(() => setUndo(null), []);

  const choose = (activity: PersonalActivity) =>
    setSelection((previous) => {
      const next = { ...previous };
      if (activity.id in next) delete next[activity.id];
      else next[activity.id] = activity.version;
      return next;
    });
  const prepare = (mode: 'copy' | 'move') => {
    const ids = Object.keys(selection ?? {});
    const values = ids.map((id) => activities.find((a) => a.id === id && a.version === selection![id]));
    if (values.some((a) => !a)) return setError('Una actividad cambió. Revisa tu selección.');
    if (!values.length) return;
    setError(null);
    setTransfer(createTransferDraft(values as PersonalActivity[], mode, schedule?.activeSemesterId ?? null));
  };

  const items = [...view.groups.flatMap((g) => g.items), ...view.done];
  const sheetItem = sheet ? items.find((i) => i.activity.id === sheet) ?? null : null;
  const row = (mode: 'pending' | 'done', late = false) => (item: PendingItem, index: number) => (
    <PendingRow
      key={item.activity.id}
      item={item}
      mode={selection ? 'select' : mode}
      late={late}
      selected={!!selection && item.activity.id in selection}
      divider={index > 0}
      disabled={planner.busy}
      onToggle={() => toggle(item.activity)}
      onOpen={() => {
        if (selection) choose(item.activity);
        else {
          setError(null);
          setSheet(item.activity.id);
        }
      }}
    />
  );
  const emptyText = kind !== 'all'
    ? 'No tienes pendientes de este tipo.'
    : !activities.length
    ? 'Crea tu primera prueba o tarea con «Nueva».'
    : 'No tienes pendientes por ahora.';

  return (
    <View style={s.page}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={s.content}>
        <PendingSummary
          summary={document ? view.summary : null}
          week={view.week}
          disabled={!document || planner.busy}
          onNew={() => setForm({})}
        />
        {document && <KindFilter value={kind} counts={view.counts} onChange={setKind} />}
        {planner.loading && <GotaLoader text='Cargando tus pendientes…' />}
        {planner.error && <Text style={s.error} accessibilityRole='alert'>{planner.error}</Text>}
        {error && !sheet && !transfer && !deleting && (
          <Text style={s.error} accessibilityRole='alert'>{error}</Text>
        )}
        {document && !view.groups.length && (
          <View style={[s.card, s.empty]}>
            <Text style={s.emptyTitle}>Todo al día</Text>
            <Text style={s.emptyText}>{emptyText}</Text>
          </View>
        )}
        {view.groups.map((group, index) => (
          <PendingGroup
            key={group.id}
            group={group}
            index={index}
            renderRow={row('pending', group.id === 'late')}
          />
        ))}
        <DoneSection items={view.done} renderRow={row('done')} />
        {document && (
          <View>
            <ScalePress
              style={s.link}
              onPress={() => setPicker(true)}
              accessibilityRole='button'
              accessibilityHint='Elige qué semestre mostrar'
            >
              <Text style={s.linkText}>
                Mostrando: {semesterFilterLabel(filter, semesters)} · Cambiar
              </Text>
            </ScalePress>
            <Text style={s.local}>Se guardan solo en este dispositivo.</Text>
          </View>
        )}
      </ScrollView>
      {selection
        ? (
          <SelectionBar
            count={Object.keys(selection).length}
            onCopy={() => prepare('copy')}
            onMove={() => prepare('move')}
            onCancel={() => setSelection(null)}
          />
        )
        : undo && (
          <UndoToast
            key={undo.key}
            message={undo.done ? 'Marcada como hecha' : 'Marcada como pendiente'}
            disabled={planner.busy}
            onUndo={revert}
            onHide={hideUndo}
          />
        )}
      <BottomNav currentTab='pending' />
      {sheetItem && (
        <PendingActionsSheet
          item={sheetItem}
          busy={planner.busy}
          error={error}
          semesterMissing={!!sheetItem.activity.semesterId &&
            !semesters.some((x) => x.id === sheetItem.activity.semesterId)}
          onClose={() => setSheet(null)}
          actions={{
            toggleDone: () => toggle(sheetItem.activity),
            edit: () => {
              setSheet(null);
              setForm({ activity: sheetItem.activity });
            },
            openAgenda: () => {
              setSheet(null);
              router.push({ pathname: '/agenda', params: { date: sheetItem.activity.date } });
            },
            transfer: () => {
              const { activity } = sheetItem, active = schedule?.activeSemesterId ?? null;
              setSheet(null);
              setTransfer(createTransferDraft(
                [activity],
                'copy',
                active !== activity.semesterId ? active : null,
              ));
            },
            selectMany: () => {
              setSheet(null);
              setUndo(null);
              setSelection({ [sheetItem.activity.id]: sheetItem.activity.version });
            },
            remove: () => {
              setSheet(null);
              setError(null);
              setDeleting(sheetItem.activity);
            },
          }}
        />
      )}
      {picker && (
        <SemesterFilterSheet
          value={filter}
          semesters={semesters}
          onClose={() => setPicker(false)}
          onChange={(value) => {
            setSemester(value);
            setPicker(false);
          }}
        />
      )}
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
          <Text style={scheduleStyles.subtitle}>
            Se eliminará {deleting.title} de este dispositivo.
          </Text>
          {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
          <PlannerButton
            danger
            label='Confirmar eliminación de actividad'
            disabled={planner.busy}
            onPress={() =>
              void planner.removeActivity(deleting.id, deleting.version).then(() => {
                setDeleting(null);
                setSelection(null);
                setUndo(null);
              }).catch((e: unknown) => setError(message(e)))}
          />
        </PlannerModal>
      )}
      {transfer && (
        <ActivityTransferModal
          planner={planner}
          draft={transfer}
          onClose={() => setTransfer(null)}
          onDone={() => {
            setTransfer(null);
            setSelection(null);
            setError(null);
          }}
        />
      )}
    </View>
  );
}
