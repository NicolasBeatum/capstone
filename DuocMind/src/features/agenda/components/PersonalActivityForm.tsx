import { useState } from 'react';
import { Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { personalActivityEnd } from '@/shared/planner/domain/personalActivityTime';
import {
  addDays,
  civilNow,
  dateWeekday,
  WEEKDAYS,
} from '@/shared/planner/domain/weeklySchedule';
import {
  activityFormSemester,
  changeActivityType,
  prepareActivityForm,
} from '@/shared/planner/application/activityForm';
import type { PlannerModel } from '@/shared/planner/application/plannerContext';
import {
  ACTIVITY_LABELS,
  type ActivityKind,
  type PersonalActivity,
} from '@/shared/planner/application/plannerStore';
import { ActivityMonthCalendar } from './ActivityMonthCalendar';
import { ActivityTimeRow } from './ActivityTimeField';
import { AgendaWeekStrip } from './AgendaWeekStrip';
import {
  PlannerButton,
  PlannerChip,
  PlannerField,
  PlannerModal,
  PlannerSegmented,
} from './PlannerControls';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
const SUBJECTS_SHOWN = 6;
const monthTitle = (date: string) =>
  new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );
export function PersonalActivityForm(
  { planner, date, activity, onClose, onSaved }: {
    planner: PlannerModel;
    date: string;
    activity?: PersonalActivity;
    onClose: () => void;
    onSaved?: (date: string) => void;
  },
) {
  const [form, setForm] = useState<PersonalActivity>(() =>
    activity ??
      {
        id: Crypto.randomUUID(),
        kind: 'personal',
        date,
        time: '09:00',
        endTime: '10:00',
        title: '',
        subjectName: null,
        semesterId: null,
        semesterName: null,
        version: 1,
      }
  );
  const [error, setError] = useState<string | null>(null),
    [showMonth, setShowMonth] = useState(false),
    [allSubjects, setAllSubjects] = useState(false),
    doc = planner.snapshot?.document.schedule;
  const academic = form.kind !== 'personal';
  const semester = doc ? activityFormSemester(doc, academic ? activity : undefined) : null;
  const subjects = doc?.subjects.filter((subject) => subject.semesterId === semester?.id).sort(
    (a, b) => a.name.localeCompare(b.name, 'es'),
  ) ?? [];
  const change = (next: Partial<PersonalActivity>) => {
    setForm({ ...form, ...next });
    setError(null);
  };
  const endTime = personalActivityEnd(form.time, form.endTime),
    today = civilNow(planner.now).date,
    monday = addDays(form.date, 1 - dateWeekday(form.date)),
    week = WEEKDAYS.map((weekday, index) => {
      const key = addDays(monday, index);
      return {
        key,
        weekday: weekday.slice(0, 3).toUpperCase(),
        number: Number(key.slice(8)),
        busy: false,
      };
    }),
    visibleSubjects = allSubjects ? subjects : subjects.filter((subject, index) =>
      index < SUBJECTS_SHOWN || subject.name === form.subjectName
    );
  const save = async () => {
    try {
      if (!doc) throw new Error('Espera a que cargue tu horario.');
      await planner.saveActivity(prepareActivityForm(form, doc, activity));
      onSaved?.(form.date);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  };
  return (
    <PlannerModal
      sheet
      title={activity ? 'Editar actividad' : 'Nueva actividad'}
      busy={planner.busy}
      onClose={onClose}
      footer={
        <View style={s.field}>
          {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
          <PlannerButton
            label='Guardar actividad'
            disabled={planner.busy}
            onPress={() => void save()}
          />
        </View>
      }
    >
      <PlannerField
        prominent
        label='Nombre de la actividad'
        placeholder='¿Qué tienes que hacer?'
        value={form.title}
        onChangeText={(title) => change({ title })}
      />
      <PlannerSegmented
        options={(Object.keys(ACTIVITY_LABELS) as ActivityKind[]).map((kind) =>
          [kind, ACTIVITY_LABELS[kind]] as const
        )}
        value={form.kind}
        onChange={(kind) => {
          if (doc) {
            setForm(changeActivityType(form, kind, doc, activity));
            setError(null);
          }
        }}
      />
      {showMonth
        ? (
          <ActivityMonthCalendar
            selected={form.date}
            today={today}
            onSelect={(key) => {
              change({ date: key });
              setShowMonth(false);
            }}
          />
        )
        : (
          <AgendaWeekStrip
            title={monthTitle(form.date)}
            days={week}
            selectedKey={form.date}
            todayKey={today}
            onSelect={(key) => change({ date: key })}
            onPrevious={() => change({ date: addDays(form.date, -7) })}
            onNext={() => change({ date: addDays(form.date, 7) })}
          />
        )}
      <PlannerChip
        label={showMonth ? 'Ver semana' : 'Otra fecha'}
        onPress={() => setShowMonth(!showMonth)}
      />
      <View style={s.timeCard}>
        <ActivityTimeRow
          title='Inicio'
          label='Hora de inicio de la actividad'
          value={form.time}
          onChange={(time) => change({ time, endTime })}
        />
        <View style={s.divider} />
        <ActivityTimeRow
          title='Término'
          label='Hora de término de la actividad'
          value={endTime}
          onChange={(value) => change({ endTime: value })}
        />
      </View>
      <Text style={s.label}>Ramo ({academic ? 'obligatorio' : 'opcional'})</Text>
      {academic && semester && (
        <Text style={s.pill}>
          {activity && activity.kind !== 'personal' && activity.semesterId
            ? 'Semestre de esta actividad'
            : 'Semestre activo'}: {semester.name}
        </Text>
      )}
      <View style={s.row}>
        {!academic && (
          <PlannerChip
            label='Sin ramo'
            selected={form.subjectName === null}
            onPress={() => change({ subjectName: null })}
          />
        )}
        {visibleSubjects.map((subject) => (
          <PlannerChip
            key={subject.id}
            label={[subject.name, subject.code, subject.section].filter(Boolean).join(' · ')}
            selected={form.subjectName === subject.name}
            onPress={() => change({ subjectName: subject.name })}
          />
        ))}
        {visibleSubjects.length < subjects.length && (
          <PlannerChip label='Ver todos' onPress={() => setAllSubjects(true)} />
        )}
      </View>
      {activity && form.subjectName === activity.subjectName &&
        form.subjectName &&
        !subjects.some((subject) => subject.name === activity.subjectName) && (
        <Text style={s.notice}>
          Se conserva el ramo guardado: {activity.subjectName}.
        </Text>
      )}
      {academic && !subjects.length && !activity?.subjectName && (
        <Text style={s.notice}>
          Agrega un ramo a tu horario de clases para registrar pruebas y tareas.
        </Text>
      )}
    </PlannerModal>
  );
}
