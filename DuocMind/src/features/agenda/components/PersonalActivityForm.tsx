import { useState } from 'react';
import { Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { personalActivityEnd } from '@/shared/planner/domain/personalActivityTime';
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
import { PlannerButton, PlannerField, PlannerModal } from './PlannerControls';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
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
    doc = planner.snapshot?.document.working;
  const academic = form.kind !== 'personal';
  const semester = doc ? activityFormSemester(doc, academic ? activity : undefined) : null;
  const subjects = doc?.subjects.filter((subject) => subject.semesterId === semester?.id).sort(
    (a, b) => a.name.localeCompare(b.name, 'es'),
  ) ?? [];
  const change = (next: Partial<PersonalActivity>) => {
    setForm({ ...form, ...next });
    setError(null);
  };
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
      <Text style={s.notice}>
        Solo en este dispositivo. Cambiar de semestre no borra esta actividad.
      </Text>
      <PlannerField
        label='Nombre de la actividad'
        value={form.title}
        onChangeText={(title) => change({ title })}
      />
      <Text style={s.label}>Tipo</Text>
      <View style={s.row}>
        {(Object.keys(ACTIVITY_LABELS) as ActivityKind[]).map((kind) => (
          <PlannerButton
            key={kind}
            label={ACTIVITY_LABELS[kind]}
            secondary={form.kind !== kind}
            selected={form.kind === kind}
            onPress={() => {
              if (doc) {
                setForm(changeActivityType(form, kind, doc, activity));
                setError(null);
              }
            }}
          />
        ))}
      </View>
      <PlannerField
        label='Fecha de la actividad'
        value={form.date}
        maxLength={10}
        placeholder='AAAA-MM-DD'
        onChangeText={(date) => change({ date })}
      />
      <PlannerField
        label='Hora de inicio de la actividad'
        value={form.time}
        maxLength={5}
        placeholder='09:00'
        onChangeText={(time) =>
          change({ time, endTime: personalActivityEnd(form.time, form.endTime) })}
      />
      <PlannerField
        label='Hora de término de la actividad'
        value={personalActivityEnd(form.time, form.endTime)}
        maxLength={5}
        placeholder='10:00'
        onChangeText={(endTime) => change({ endTime })}
      />
      <Text style={s.subtitle}>El término debe ser posterior al inicio, en el mismo día.</Text>
      {academic && semester && (
        <Text style={s.pill}>
          {activity && activity.kind !== 'personal' && activity.semesterId
            ? 'Semestre de esta actividad'
            : 'Semestre activo'}: {semester.name}
        </Text>
      )}
      <Text style={s.label}>
        Ramo ({academic ? 'obligatorio' : 'opcional'})
      </Text>
      {form.subjectName && <Text style={s.subtitle}>Seleccionado: {form.subjectName}</Text>}
      <View style={s.row}>
        {!academic && (
          <PlannerButton
            label='Sin ramo'
            secondary={form.subjectName !== null}
            selected={form.subjectName === null}
            onPress={() => change({ subjectName: null })}
          />
        )}
        {subjects.map((subject) => (
          <PlannerButton
            key={subject.id}
            label={[subject.name, subject.code, subject.section].filter(Boolean)
              .join(' · ')}
            secondary={form.subjectName !== subject.name}
            selected={form.subjectName === subject.name}
            onPress={() => change({ subjectName: subject.name })}
          />
        ))}
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
      {!academic && (
        <Text style={s.subtitle}>
          Puedes elegir un ramo o dejarla sin ramo para tus actividades personales.
        </Text>
      )}
    </PlannerModal>
  );
}
