import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { ScalePress } from '@/shared/components/ScalePress';
import type { PlannerModel } from '@/shared/planner/application/plannerContext';
import type { ScheduleDocument } from '@/shared/planner/domain/schedule';
import { WEEKDAYS } from '@/shared/planner/domain/weeklySchedule';
import { prepareClassRegistration } from '@/shared/planner/domain/classRegistration';
import { PlannerButton, PlannerField, PlannerModal } from './PlannerControls';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';

interface BlockDraft {
  id: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  room: string;
  teacher: string;
}
const newBlock = (weekday: number): BlockDraft => ({
  id: Crypto.randomUUID(),
  weekday,
  startsAt: '08:30',
  endsAt: '10:00',
  room: '',
  teacher: '',
});
type Prepared = ReturnType<typeof prepareClassRegistration>;

export function ClassScheduleForm({ planner, base, weekday, onClose, onSaved }: {
  planner: PlannerModel;
  base: ScheduleDocument;
  weekday: number;
  onClose: () => void;
  onSaved: (weekday: number) => void;
}) {
  const [semesterId] = useState(() => base.activeSemesterId ?? Crypto.randomUUID());
  const [subjectId] = useState(() => Crypto.randomUUID());
  const semester = base.semesters.find((value) => value.id === semesterId);
  const subjects = base.subjects.filter((value) => value.semesterId === semesterId);
  const [semesterName, setSemesterName] = useState('Semestre 1');
  const [existingId, setExistingId] = useState<string | null>(null),
    [choosing, setChoosing] = useState(false);
  const [name, setName] = useState(''),
    [code, setCode] = useState(''),
    [section, setSection] = useState('');
  const [optional, setOptional] = useState(false),
    [blocks, setBlocks] = useState(() => [newBlock(weekday)]);
  const [error, setError] = useState<string | null>(null),
    [review, setReview] = useState<Prepared | null>(null);
  const selectedSubject = subjects.find((subject) => subject.id === existingId);
  const changed = () => {
    setError(null);
    setReview(null);
  };
  const changeBlock = (id: string, next: Partial<BlockDraft>) => {
    changed();
    setBlocks((previous) =>
      previous.map((block) => block.id === id ? { ...block, ...next } : block)
    );
  };
  async function save(confirmed = false) {
    try {
      const subject = selectedSubject ?? { id: subjectId, semesterId, name, code, section };
      const prepared = prepareClassRegistration(
        base,
        semester ? null : { id: semesterId, name: semesterName, startsOn: null, endsOn: null },
        subject,
        blocks.map((block) => ({
          ...block,
          subjectId: subject.id,
          startsAt: block.startsAt.trim(),
          endsAt: block.endsAt.trim(),
        })),
      );
      if (prepared.overlaps.length && !confirmed) {
        setReview(prepared);
        setError(null);
        return;
      }
      await planner.editSchedule(base, () => prepared.document);
      onSaved(blocks[0].weekday);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar tus clases.');
    }
  }
  if (review) {
    return (
      <PlannerModal
        title='Revisa los cruces'
        busy={planner.busy}
        onClose={onClose}
        footer={
          <View style={s.field}>
            {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
            <PlannerButton
              label='Conservar los cruces y guardar'
              disabled={planner.busy}
              onPress={() => void save(true)}
            />
          </View>
        }
      >
        <Text style={s.notice} accessibilityRole='alert'>
          Hay bloques que se cruzan. ¿Quieres conservarlos?
        </Text>
        {review.overlaps.map(({ block, other }) => (
          <View key={[block.id, other.id].sort().join('/')} style={s.card}>
            <Text style={s.label}>{WEEKDAYS[block.weekday - 1]}</Text>
            <Text style={s.subtitle}>
              {review.document.subjects.find((subject) =>
                subject.id === block.subjectId
              )?.name} · {block.startsAt}–{block.endsAt}
            </Text>
            <Text style={s.subtitle}>
              {review.document.subjects.find((subject) =>
                subject.id === other.subjectId
              )?.name} · {other.startsAt}–{other.endsAt}
            </Text>
          </View>
        ))}
        <PlannerButton
          secondary
          label='Volver al formulario'
          disabled={planner.busy}
          onPress={() => {
            setReview(null);
            setError(null);
          }}
        />
      </PlannerModal>
    );
  }
  return (
    <PlannerModal
      title={semester ? 'Agregar clases' : 'Crea tu horario de clases'}
      busy={planner.busy}
      onClose={onClose}
      footer={
        <View style={s.field}>
          {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
          <PlannerButton
            label='Guardar clases'
            disabled={planner.busy}
            onPress={() => void save()}
          />
        </View>
      }
    >
      <Text style={s.subtitle}>
        Escribe tu ramo y los días en que tienes clases. Aparecerán en tu agenda cada semana.
      </Text>
      {semester ? <Text style={s.pill}>{semester.name}</Text> : (
        <PlannerField
          label='Nombre del semestre'
          value={semesterName}
          maxLength={80}
          onChangeText={(value) => {
            changed();
            setSemesterName(value);
          }}
        />
      )}
      <View style={s.formSection}>
        <Text style={s.cardTitle}>1. Tu ramo</Text>
        {selectedSubject
          ? (
            <>
              <Text style={s.label}>{selectedSubject.name}</Text>
              <PlannerButton
                secondary
                label='Cambiar ramo'
                onPress={() => {
                  changed();
                  setChoosing(true);
                }}
              />
            </>
          )
          : (
            <>
              <PlannerField
                label='Nombre del ramo'
                value={name}
                placeholder='Ej. Programación web'
                onChangeText={(value) => {
                  changed();
                  setName(value);
                }}
              />
              {subjects.length > 0 && (
                <PlannerButton
                  secondary
                  label='Usar un ramo que ya agregué'
                  onPress={() => setChoosing(!choosing)}
                />
              )}
            </>
          )}
        {choosing && (
          <ScrollView style={s.subjectPicker} contentContainerStyle={s.form} nestedScrollEnabled>
            {subjects.map((subject) => (
              <PlannerButton
                key={subject.id}
                secondary
                label={`Elegir ${
                  [subject.name, subject.code, subject.section].filter(Boolean).join(' · ')
                }`}
                onPress={() => {
                  changed();
                  setExistingId(subject.id);
                  setChoosing(false);
                }}
              />
            ))}
            {existingId && (
              <PlannerButton
                secondary
                label='Escribir un ramo nuevo'
                onPress={() => {
                  changed();
                  setExistingId(null);
                  setChoosing(false);
                }}
              />
            )}
          </ScrollView>
        )}
        {!selectedSubject && (
          <PlannerButton
            secondary
            label={optional
              ? 'Ocultar datos opcionales'
              : 'Añadir sigla, sección o docente (opcional)'}
            onPress={() => setOptional(!optional)}
          />
        )}
        {!selectedSubject && optional && (
          <>
            <PlannerField
              label='Sigla (opcional)'
              value={code}
              maxLength={40}
              onChangeText={(value) => {
                changed();
                setCode(value);
              }}
            />
            <PlannerField
              label='Sección (opcional)'
              value={section}
              maxLength={40}
              onChangeText={(value) => {
                changed();
                setSection(value);
              }}
            />
          </>
        )}
      </View>
      <View style={s.formSection}>
        <Text style={s.cardTitle}>2. ¿Cuándo tienes clases?</Text>
        <Text style={s.subtitle}>
          Hora de Santiago de Chile. Cada bloque puede tener una sala distinta.
        </Text>
        {blocks.map((block, index) => (
          <View key={block.id} style={s.blockForm}>
            <View style={s.header}>
              <Text style={s.label}>Bloque {index + 1}</Text>
              {blocks.length > 1 && (
                <PlannerButton
                  secondary
                  label={`Quitar bloque ${index + 1}`}
                  onPress={() => {
                    changed();
                    setBlocks((previous) => previous.filter((value) => value.id !== block.id));
                  }}
                />
              )}
            </View>
            <View
              style={s.row}
              accessibilityRole='radiogroup'
              accessibilityLabel={`Día del bloque ${index + 1}`}
            >
              {WEEKDAYS.map((day, dayIndex) => (
                <ScalePress
                  key={day}
                  style={[s.weekday, block.weekday === dayIndex + 1 && s.weekdaySelected]}
                  onPress={() => changeBlock(block.id, { weekday: dayIndex + 1 })}
                  accessibilityRole='radio'
                  accessibilityLabel={`Bloque ${index + 1}: ${day}`}
                  accessibilityState={{ checked: block.weekday === dayIndex + 1 }}
                  aria-checked={block.weekday === dayIndex + 1}
                >
                  <Text
                    style={[s.weekdayText, block.weekday === dayIndex + 1 && s.weekdayTextSelected]}
                  >
                    {day.slice(0, 3)}
                  </Text>
                </ScalePress>
              ))}
            </View>
            <View style={s.timeFields}>
              <View style={s.timeField}>
                <PlannerField
                  label={`Inicio del bloque ${index + 1}`}
                  maxLength={5}
                  value={block.startsAt}
                  placeholder='08:30'
                  onChangeText={(startsAt) => changeBlock(block.id, { startsAt })}
                />
              </View>
              <View style={s.timeField}>
                <PlannerField
                  label={`Término del bloque ${index + 1}`}
                  maxLength={5}
                  value={block.endsAt}
                  placeholder='10:00'
                  onChangeText={(endsAt) => changeBlock(block.id, { endsAt })}
                />
              </View>
            </View>
            <PlannerField
              label={`Sala del bloque ${index + 1} (opcional)`}
              value={block.room}
              placeholder='Ej. Sala 301 o Laboratorio 402'
              onChangeText={(room) => changeBlock(block.id, { room })}
            />
            {optional && (
              <PlannerField
                label={`Docente del bloque ${index + 1} (opcional)`}
                value={block.teacher}
                maxLength={160}
                onChangeText={(teacher) => changeBlock(block.id, { teacher })}
              />
            )}
          </View>
        ))}
        <PlannerButton
          secondary
          label='Agregar otro bloque semanal'
          onPress={() => {
            changed();
            setBlocks((previous) => [...previous, newBlock(previous[previous.length - 1].weekday)]);
          }}
        />
        {selectedSubject && (
          <PlannerButton
            secondary
            label={optional ? 'Ocultar docente' : 'Añadir docente (opcional)'}
            onPress={() => setOptional(!optional)}
          />
        )}
      </View>
    </PlannerModal>
  );
}
