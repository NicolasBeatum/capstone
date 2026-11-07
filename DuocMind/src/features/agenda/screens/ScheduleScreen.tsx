import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { LiquidBackground } from '@/shared/components/Glass';
import { BottomNav } from '@/shared/components/BottomNav';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import { type PlannerModel, usePlanner } from '@/shared/planner/application/usePlanner';
import {
  activateSemester,
  putSemester,
  putSubject,
  removeSubject,
  type ScheduleDocument,
  type ScheduleSubject,
  type Semester,
} from '@/shared/planner/domain/schedule';
import { civilNow, dateWeekday, semesterWeek } from '@/shared/planner/domain/weeklySchedule';
import { PlannerButton, PlannerField, PlannerModal } from '../components/PlannerControls';
import { ClassScheduleForm } from '../components/ClassScheduleForm';
import { PlannerNotice } from '../components/PlannerNotice';
import { PlannerHeader } from '../components/PlannerHeader';
import { SubjectCard } from '../components/SubjectCard';
import { WeekSchedule } from '../components/WeekSchedule';
import { styles as a } from './AgendaScreen.styles';
import { scheduleStyles as s } from './ScheduleScreen.styles';
type Form = {
  kind: 'semester';
  base: ScheduleDocument;
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
} | {
  kind: 'subject';
  base: ScheduleDocument;
  id: string;
  semesterId: string;
  name: string;
  code: string;
  section: string;
};
export default function ScheduleScreen() {
  const planner = usePlanner();
  const session = planner.snapshot?.session;
  return (
    <ScheduleScreenContent
      key={session ? `${session.userId}:${session.generation}` : 'signed-out'}
      planner={planner}
    />
  );
}
function ScheduleScreenContent({ planner }: { planner: PlannerModel }) {
  const router = useRouter(), doc = planner.snapshot?.document.schedule;
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [form, setForm] = useState<Form | null>(null),
    [tab, setTab] = useState<'week' | 'subjects'>('week'),
    [picking, setPicking] = useState(false),
    [classForm, setClassForm] = useState<ScheduleDocument | null>(null),
    [error, setError] = useState<string | null>(null),
    [deleting, setDeleting] = useState<{ base: ScheduleDocument; subject: ScheduleSubject } | null>(
      null,
    );
  const selected = doc?.semesters.find((s) => s.id === (selectedId ?? doc.activeSemesterId)) ??
    doc?.semesters.find((s) => s.id === doc.activeSemesterId);
  const active = selected?.id === doc?.activeSemesterId,
    week = doc && selected ? semesterWeek(doc, selected.id) : [],
    subjects = doc?.subjects.filter((subject) => subject.semesterId === selected?.id).sort((x, y) =>
      x.name.localeCompare(y.name, 'es')
    ) ?? [];
  const semesterForm = (value?: Semester) => {
    if (doc) {
      setPicking(false);
      setError(null);
      setForm({
        kind: 'semester',
        base: doc,
        id: value?.id ?? Crypto.randomUUID(),
        name: value?.name ?? '',
        startsOn: value?.startsOn ?? '',
        endsOn: value?.endsOn ?? '',
      });
    }
  };
  const subjectForm = (value?: ScheduleSubject) => {
    if (doc && selected) {
      setError(null);
      setForm({
        kind: 'subject',
        base: doc,
        id: value?.id ?? Crypto.randomUUID(),
        semesterId: selected.id,
        name: value?.name ?? '',
        code: value?.code ?? '',
        section: value?.section ?? '',
      });
    }
  };
  const save = async () => {
    if (!form) return;
    try {
      if (form.kind === 'semester') {
        await planner.editSchedule(
          form.base,
          (d) =>
            putSemester(d, {
              id: form.id,
              name: form.name,
              startsOn: form.startsOn.trim() || null,
              endsOn: form.endsOn.trim() || null,
            }),
        );
        setSelectedId(form.id);
      } else {await planner.editSchedule(form.base, (d) =>
          putSubject(d, {
            id: form.id,
            semesterId: form.semesterId,
            name: form.name,
            code: form.code,
            section: form.section,
          }));}
      setForm(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  };
  return (
    <View style={a.safeArea}>
      <LiquidBackground />
      <ScrollView
        contentContainerStyle={a.scrollContent}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <Reveal>
          <PlannerHeader
            title='Mis horarios'
            subtitle='Tus ramos y clases de cada semestre.'
            backLabel='Volver a la agenda'
            onBack={() => router.replace('/agenda')}
          />
        </Reveal>
        {!planner.loading && !doc?.semesters.length && (
          <View style={a.emptyCard}>
            <Text style={a.emptyTitle}>Tu primer horario</Text>
            <Text style={a.emptyText}>
              Crea un semestre y escribe los ramos que estás cursando, sin importar tu malla.
            </Text>
            <ScalePress
              style={[a.emptyButton, (!doc || planner.busy) && s.disabled]}
              disabled={!doc || planner.busy}
              onPress={() => semesterForm()}
              accessibilityRole='button'
              accessibilityLabel='Nuevo semestre'
            >
              <Text style={a.emptyButtonText}>Nuevo semestre</Text>
            </ScalePress>
          </View>
        )}
        {selected && doc && (
          <Reveal index={1}>
            <View style={s.semesterRow}>
              <ScalePress
                style={s.semesterPicker}
                onPress={() => setPicking(true)}
                accessibilityRole='button'
                accessibilityLabel={`Cambiar semestre, viendo ${selected.name}${
                  active ? ' · Activo' : ''
                }`}
              >
                <Text style={s.semesterPickerText}>{selected.name}</Text>
                <Text style={s.semesterChevron}>▾</Text>
              </ScalePress>
              {active && <Text style={s.pill}>Activo</Text>}
            </View>
            {(selected.startsOn || selected.endsOn) && (
              <Text style={a.dayCount}>
                {selected.startsOn ?? 'Sin fecha de inicio'} ·{' '}
                {selected.endsOn ?? 'Sin fecha de término'}
              </Text>
            )}
          </Reveal>
        )}
        {selected && doc && !active && (
          <View style={s.card}>
            <Text style={s.subtitle}>Estás consultando otro semestre.</Text>
            <PlannerButton
              label='Usar este horario'
              disabled={planner.busy}
              onPress={() =>
                void planner.editSchedule(doc, (d) => activateSemester(d, selected.id)).catch(
                  (e) => setError(e.message),
                )}
            />
          </View>
        )}
        <PlannerNotice planner={planner} />
        {selected && doc && (
          <>
            <View style={s.segmented}>
              {([['week', 'Semana'], ['subjects', 'Ramos']] as const).map(([value, label]) => (
                <ScalePress
                  key={value}
                  style={[s.segment, tab === value && s.segmentSelected]}
                  onPress={() => setTab(value)}
                  accessibilityRole='button'
                  accessibilityLabel={label}
                  aria-pressed={tab === value}
                  accessibilityState={{ selected: tab === value }}
                >
                  <Text style={[s.segmentText, tab === value && s.segmentTextSelected]}>
                    {label}
                  </Text>
                </ScalePress>
              ))}
            </View>
            {tab === 'week' && !week.length && (
              <View style={a.emptyCard}>
                <Text style={a.emptyTitle}>Sin clases todavía</Text>
                <Text style={a.emptyText}>Agrega tus ramos con sus días y horas.</Text>
              </View>
            )}
            {tab === 'week' && (
              <WeekSchedule
                week={week}
                today={dateWeekday(civilNow(planner.now).date)}
                onOpen={(id, block) =>
                  router.push({ pathname: '/schedule-subject', params: { id, block } })}
              />
            )}
            {tab === 'subjects' && !subjects.length && (
              <View style={a.emptyCard}>
                <Text style={a.emptyTitle}>Sin ramos todavía</Text>
                <Text style={a.emptyText}>Agrega los ramos que cursas en este semestre.</Text>
              </View>
            )}
            {tab === 'subjects' && subjects.map((subject, index) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                blocks={doc.blocks.filter((block) => block.subjectId === subject.id)}
                index={index}
                onBlocks={() =>
                  router.push({ pathname: '/schedule-subject', params: { id: subject.id } })}
                onEdit={() => subjectForm(subject)}
                onRemove={() => {
                  setDeleting({ base: doc, subject });
                  setError(null);
                }}
              />
            ))}
            <PlannerButton
              label={tab === 'week' ? 'Agregar clase' : 'Agregar ramo'}
              disabled={planner.busy}
              onPress={() => tab === 'week' ? setClassForm(doc) : subjectForm()}
            />
          </>
        )}
        {error && !form && !deleting && (
          <Text style={s.error} accessibilityRole='alert'>{error}</Text>
        )}
      </ScrollView>
      <BottomNav currentTab='agenda' />
      {picking && doc && (
        <PlannerModal title='Semestres' busy={planner.busy} onClose={() => setPicking(false)}>
          {doc.semesters.map((semester) => (
            <PlannerButton
              key={semester.id}
              label={`${semester.name}${doc.activeSemesterId === semester.id ? ' · Activo' : ''}`}
              secondary={selected?.id !== semester.id}
              selected={selected?.id === semester.id}
              onPress={() => {
                setSelectedId(semester.id);
                setPicking(false);
              }}
            />
          ))}
          <View style={s.divider} />
          <PlannerButton
            secondary
            label='Nuevo semestre'
            disabled={planner.busy}
            onPress={() => semesterForm()}
          />
          {selected && (
            <PlannerButton
              secondary
              label='Editar semestre'
              onPress={() => semesterForm(selected)}
            />
          )}
        </PlannerModal>
      )}
      {classForm && selected && (
        <ClassScheduleForm
          planner={planner}
          base={classForm}
          weekday={1}
          semesterId={selected.id}
          onClose={() => setClassForm(null)}
          onSaved={() => setClassForm(null)}
        />
      )}
      {form && (
        <PlannerModal
          title={form.kind === 'semester' ? 'Guardar semestre' : 'Guardar ramo'}
          busy={planner.busy}
          onClose={() => setForm(null)}
        >
          <PlannerField
            label={form.kind === 'semester' ? 'Nombre del semestre' : 'Nombre del ramo'}
            value={form.name}
            maxLength={form.kind === 'semester' ? 80 : 120}
            onChangeText={(name) => setForm({ ...form, name })}
          />
          {form.kind === 'semester'
            ? (
              <>
                <PlannerField
                  label='Inicio (opcional)'
                  value={form.startsOn}
                  placeholder='AAAA-MM-DD'
                  maxLength={10}
                  onChangeText={(startsOn) => setForm({ ...form, startsOn })}
                />
                <PlannerField
                  label='Término (opcional)'
                  value={form.endsOn}
                  placeholder='AAAA-MM-DD'
                  maxLength={10}
                  onChangeText={(endsOn) => setForm({ ...form, endsOn })}
                />
                <Text style={s.notice}>
                  Las clases se repiten dentro de estas fechas. Al terminar el semestre, tu horario
                  se conserva.
                </Text>
              </>
            )
            : (
              <>
                <PlannerField
                  label='Sigla (opcional)'
                  value={form.code}
                  maxLength={40}
                  onChangeText={(code) => setForm({ ...form, code })}
                />
                <PlannerField
                  label='Sección (opcional)'
                  value={form.section}
                  maxLength={40}
                  onChangeText={(section) => setForm({ ...form, section })}
                />
              </>
            )}
          {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
          <PlannerButton label='Guardar' disabled={planner.busy} onPress={() => void save()} />
        </PlannerModal>
      )}
      {deleting && doc && (
        <PlannerModal
          title='Eliminar ramo'
          busy={planner.busy}
          onClose={() => setDeleting(null)}
        >
          <Text style={s.subtitle}>
            Se eliminarán {deleting.subject.name}{' '}
            y sus bloques. Tus actividades, pruebas y tareas se conservan.
          </Text>
          {error && <Text style={s.error}>{error}</Text>}
          <PlannerButton
            label='Confirmar eliminación'
            danger
            disabled={planner.busy}
            onPress={() =>
              void planner.editSchedule(deleting.base, (d) => removeSubject(d, deleting.subject.id))
                .then(() => setDeleting(null)).catch((e) => setError(e.message))}
          />
        </PlannerModal>
      )}
    </View>
  );
}
