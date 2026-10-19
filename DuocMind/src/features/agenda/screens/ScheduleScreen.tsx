import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { LiquidBackground } from '@/shared/components/Glass';
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
import { PlannerButton, PlannerField, PlannerModal } from '../components/PlannerControls';
import { PlannerSyncNotice } from '../components/PlannerSyncNotice';
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
  const router = useRouter(), doc = planner.snapshot?.document.working;
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [form, setForm] = useState<Form | null>(null),
    [error, setError] = useState<string | null>(null),
    [deleting, setDeleting] = useState<{ base: ScheduleDocument; subject: ScheduleSubject } | null>(
      null,
    );
  const selected = doc?.semesters.find((s) => s.id === (selectedId ?? doc.activeSemesterId)) ??
    doc?.semesters.find((s) => s.id === doc.activeSemesterId);
  const semesterForm = (value?: Semester) => {
    if (doc) {
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
    <View style={s.page}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps='handled'>
        <View style={s.header}>
          <PlannerButton
            label='Volver a la agenda'
            secondary
            onPress={() => router.replace('/agenda')}
          />
          <Text style={s.title} accessibilityRole='header'>Mis horarios</Text>
        </View>
        <Text style={s.subtitle}>
          Organiza tus ramos por semestre. Puedes cambiar el horario activo y conservar los
          anteriores.
        </Text>
        <PlannerSyncNotice planner={planner} />
        <PlannerButton
          label='Nuevo semestre'
          disabled={!doc || planner.busy}
          onPress={() => semesterForm()}
        />
        <View style={s.row}>
          {doc?.semesters.map((semester) => (
            <PlannerButton
              key={semester.id}
              label={`${semester.name}${doc.activeSemesterId === semester.id ? ' · Activo' : ''}`}
              secondary={selected?.id !== semester.id}
              selected={selected?.id === semester.id}
              onPress={() => setSelectedId(semester.id)}
            />
          ))}
        </View>
        {!planner.loading && !doc?.semesters.length && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Tu primer horario</Text>
            <Text style={s.subtitle}>
              Crea un semestre y escribe los ramos que estás cursando, sin importar tu malla.
            </Text>
          </View>
        )}
        {selected && doc && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>{selected.name}</Text>
              <Text style={s.pill}>
                {selected.id === doc.activeSemesterId
                  ? 'Horario activo'
                  : 'Estás consultando otro semestre'}
              </Text>
              <Text style={s.subtitle}>
                {selected.startsOn ?? 'Sin fecha de inicio'} ·{' '}
                {selected.endsOn ?? 'Sin fecha de término'}
              </Text>
              <View style={s.row}>
                <PlannerButton
                  secondary
                  label='Editar semestre'
                  onPress={() => semesterForm(selected)}
                />
                {selected.id !== doc.activeSemesterId && (
                  <PlannerButton
                    label='Usar este horario'
                    disabled={planner.busy}
                    onPress={() =>
                      void planner.editSchedule(doc, (d) => activateSemester(d, selected.id)).catch(
                        (e) => setError(e.message),
                      )}
                  />
                )}
              </View>
            </View>
            <View style={s.header}>
              <Text style={s.cardTitle}>Ramos</Text>
              <PlannerButton label='Agregar ramo' onPress={() => subjectForm()} />
            </View>
            {!doc.subjects.some((subject) => subject.semesterId === selected.id) && (
              <Text style={s.subtitle}>Todavía no agregas ramos a este semestre.</Text>
            )}
            {doc.subjects.filter((subject) => subject.semesterId === selected.id).sort((a, b) =>
              a.name.localeCompare(b.name, 'es')
            ).map((subject) => (
              <View key={subject.id} style={s.card}>
                <Text style={s.cardTitle}>{subject.name}</Text>
                {(subject.code || subject.section) && (
                  <Text style={s.subtitle}>
                    {[subject.code, subject.section ? `Sección ${subject.section}` : null].filter(
                      Boolean,
                    ).join(' · ')}
                  </Text>
                )}
                <Text style={s.subtitle}>
                  {doc.blocks.filter((block) => block.subjectId === subject.id).length}{' '}
                  bloques semanales
                </Text>
                <View style={s.row}>
                  <PlannerButton
                    label={`Bloques de ${subject.name}`}
                    onPress={() =>
                      router.push({ pathname: '/schedule-subject', params: { id: subject.id } })}
                  />
                  <PlannerButton
                    secondary
                    label={`Editar ${subject.name}`}
                    onPress={() => subjectForm(subject)}
                  />
                  <PlannerButton
                    danger
                    label={`Eliminar ${subject.name}`}
                    onPress={() => {
                      setDeleting({ base: doc, subject });
                      setError(null);
                    }}
                  />
                </View>
              </View>
            ))}
          </>
        )}
        {error && !form && !deleting && (
          <Text style={s.error} accessibilityRole='alert'>{error}</Text>
        )}
      </ScrollView>
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
