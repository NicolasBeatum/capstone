import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { LiquidBackground } from '@/shared/components/Glass';
import { type PlannerModel, usePlanner } from '@/shared/planner/application/usePlanner';
import {
  parseBlock,
  type ScheduleDocument,
  type WeeklyBlock,
} from '@/shared/planner/domain/schedule';
import {
  findBlockOverlaps,
  putBlock,
  removeBlock,
  WEEKDAYS,
} from '@/shared/planner/domain/weeklySchedule';
import { PlannerButton, PlannerField, PlannerModal } from '../components/PlannerControls';
import { PlannerSyncNotice } from '../components/PlannerSyncNotice';
import { scheduleStyles as s } from './ScheduleScreen.styles';
interface Form {
  base: ScheduleDocument;
  id: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  room: string;
  teacher: string;
}
export default function SubjectScheduleScreen() {
  const planner = usePlanner();
  const session = planner.snapshot?.session;
  return (
    <SubjectScheduleScreenContent
      key={session ? `${session.userId}:${session.generation}` : 'signed-out'}
      planner={planner}
    />
  );
}
function SubjectScheduleScreenContent({ planner }: { planner: PlannerModel }) {
  const { id } = useLocalSearchParams<{ id: string }>(),
    router = useRouter(),
    doc = planner.snapshot?.document.working;
  const subject = doc?.subjects.find((subject) => subject.id === id),
    semester = doc?.semesters.find((semester) => semester.id === subject?.semesterId);
  const [form, setForm] = useState<Form | null>(null),
    [error, setError] = useState<string | null>(null),
    [overlaps, setOverlaps] = useState<WeeklyBlock[]>([]),
    [deleting, setDeleting] = useState<{ base: ScheduleDocument; block: WeeklyBlock } | null>(null);
  const open = (block?: WeeklyBlock) => {
    if (doc) {
      setError(null);
      setOverlaps([]);
      setForm({
        base: doc,
        id: block?.id ?? Crypto.randomUUID(),
        weekday: block?.weekday ?? 1,
        startsAt: block?.startsAt ?? '08:30',
        endsAt: block?.endsAt ?? '10:00',
        room: block?.room ?? '',
        teacher: block?.teacher ?? '',
      });
    }
  };
  const change = (next: Partial<Form>) => {
    if (form) setForm({ ...form, ...next });
    setOverlaps([]);
    setError(null);
  };
  const save = async (confirmed = false) => {
    if (!form || !subject) return;
    try {
      const block = parseBlock({
        id: form.id,
        subjectId: subject.id,
        weekday: form.weekday,
        startsAt: form.startsAt.trim(),
        endsAt: form.endsAt.trim(),
        room: form.room,
        teacher: form.teacher,
      });
      // Valida duplicados y referencias antes de pedir conservar un cruce.
      putBlock(form.base, block, true);
      const intersections = findBlockOverlaps(form.base, block);
      if (intersections.length && !confirmed) {
        setOverlaps(intersections);
        return;
      }
      await planner.editSchedule(form.base, (d) => putBlock(d, block, confirmed));
      setForm(null);
      setOverlaps([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el bloque.');
    }
  };
  const blocks =
    doc?.blocks.filter((b) => b.subjectId === id).sort((a, b) =>
      a.weekday - b.weekday || a.startsAt.localeCompare(b.startsAt)
    ) ?? [];
  return (
    <View style={s.page}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={s.content}>
        <PlannerButton
          label='Volver a mis horarios'
          secondary
          onPress={() => router.replace('/schedule')}
        />
        <Text style={s.title} accessibilityRole='header'>
          {subject?.name ?? 'Bloques del ramo'}
        </Text>
        {semester && <Text style={s.subtitle}>{semester.name}</Text>}
        <PlannerSyncNotice planner={planner} />
        <Text style={s.subtitle}>Cada bloque puede tener su propia sala y docente.</Text>
        {!planner.loading && !subject && (
          <Text style={s.notice}>
            Este ramo ya no está disponible. Vuelve a tus horarios para revisarlos.
          </Text>
        )}
        {subject && (
          <PlannerButton
            label='Agregar bloque'
            disabled={planner.busy}
            onPress={() => open()}
          />
        )}
        {subject && !blocks.length && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Sin bloques todavía</Text>
            <Text style={s.subtitle}>Elige los días y horas en que cursas este ramo.</Text>
          </View>
        )}
        {blocks.map((block) => (
          <View key={block.id} style={s.card}>
            <Text style={s.cardTitle}>
              {WEEKDAYS[block.weekday - 1]} · {block.startsAt}–{block.endsAt}
            </Text>
            {block.room && <Text style={s.subtitle}>{block.room}</Text>}
            {block.teacher && <Text style={s.subtitle}>{block.teacher}</Text>}
            <View style={s.row}>
              <PlannerButton
                secondary
                label={`Editar bloque ${
                  WEEKDAYS[block.weekday - 1]
                } ${block.startsAt}–${block.endsAt}`}
                onPress={() => open(block)}
              />
              <PlannerButton
                danger
                label={`Eliminar bloque ${
                  WEEKDAYS[block.weekday - 1]
                } ${block.startsAt}–${block.endsAt}`}
                onPress={() => {
                  if (doc) {
                    setDeleting({ base: doc, block });
                    setError(null);
                  }
                }}
              />
            </View>
          </View>
        ))}
      </ScrollView>
      {form && (
        <PlannerModal
          title='Bloque semanal'
          busy={planner.busy}
          onClose={() => setForm(null)}
        >
          <Text style={s.label}>Día</Text>
          <View style={s.row}>
            {WEEKDAYS.map((day, index) => (
              <PlannerButton
                key={day}
                label={day}
                secondary={form.weekday !== index + 1}
                selected={form.weekday === index + 1}
                onPress={() => change({ weekday: index + 1 })}
              />
            ))}
          </View>
          <PlannerField
            label='Hora de inicio'
            value={form.startsAt}
            maxLength={5}
            placeholder='08:30'
            onChangeText={(startsAt) => change({ startsAt })}
          />
          <PlannerField
            label='Hora de término'
            value={form.endsAt}
            maxLength={5}
            placeholder='10:00'
            onChangeText={(endsAt) => change({ endsAt })}
          />
          <PlannerField
            label='Sala de este bloque (opcional)'
            value={form.room}
            onChangeText={(room) => change({ room })}
          />
          <PlannerField
            label='Docente de este bloque (opcional)'
            value={form.teacher}
            maxLength={160}
            onChangeText={(teacher) => change({ teacher })}
          />
          {overlaps.length > 0 && (
            <View style={s.card}>
              <Text style={s.notice}>Este bloque se cruza con:</Text>
              {overlaps.map((block) => (
                <Text key={block.id} style={s.subtitle}>
                  {form.base.subjects.find((subject) => subject.id === block.subjectId)?.name} ·
                  {' '}
                  {block.startsAt}–{block.endsAt}
                </Text>
              ))}
              <PlannerButton
                label='Conservar ambos bloques'
                disabled={planner.busy}
                onPress={() => void save(true)}
              />
            </View>
          )}
          {error && <Text style={s.error} accessibilityRole='alert'>{error}</Text>}
          <PlannerButton
            label='Guardar bloque'
            disabled={planner.busy}
            onPress={() => void save()}
          />
        </PlannerModal>
      )}
      {deleting && (
        <PlannerModal
          title='Eliminar bloque'
          busy={planner.busy}
          onClose={() => setDeleting(null)}
        >
          <Text style={s.subtitle}>
            Se eliminará solo el bloque de {WEEKDAYS[deleting.block.weekday - 1]} a las{' '}
            {deleting.block.startsAt}. Los otros bloques se conservan.
          </Text>
          {error && <Text style={s.error}>{error}</Text>}
          <PlannerButton
            danger
            label='Confirmar eliminación del bloque'
            disabled={planner.busy}
            onPress={() =>
              void planner.editSchedule(deleting.base, (d) => removeBlock(d, deleting.block.id))
                .then(() => setDeleting(null)).catch((e) => setError(e.message))}
          />
        </PlannerModal>
      )}
    </View>
  );
}
