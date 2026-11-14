import { Text, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import { dateWeekday, WEEKDAYS } from '@/shared/planner/domain/weeklySchedule';
import type { DuocTimetable } from '../domain/duocTimetable';
import { blockKey, type ImportSelection, sessionKey } from '../application/scheduleImport';
import { PlannerField } from './PlannerControls';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
import { importStyles as i } from '../screens/ScheduleImportScreen.styles';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function dateLabel(date: string): string {
  const weekday = WEEKDAYS[dateWeekday(date) - 1];
  return `${weekday} ${Number(date.slice(8))} de ${MONTHS[Number(date.slice(5, 7)) - 1]}`;
}

function Check({ label, a11yLabel, checked, disabled = false, onToggle }: {
  label: string;
  a11yLabel?: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <ScalePress
      style={[i.check, disabled && i.excluded]}
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole='checkbox'
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ checked, disabled }}
      aria-checked={checked}
    >
      <View style={[i.box, checked && i.boxChecked]}>
        {checked && <Text style={i.boxMark}>✓</Text>}
      </View>
      <Text style={[i.checkText, !checked && i.checkTextOff]}>{label}</Text>
    </ScalePress>
  );
}

export function ImportPreview({ parsed, selection, onChange }: {
  parsed: DuocTimetable;
  selection: ImportSelection;
  onChange: (selection: ImportSelection) => void;
}) {
  const included = (key: string) => !selection.excluded.has(key);
  const toggle = (key: string) => {
    const excluded = new Set(selection.excluded);
    if (excluded.has(key)) excluded.delete(key);
    else excluded.add(key);
    onChange({ ...selection, excluded });
  };
  const nameOf = (key: string) =>
    selection.subjectNames[key] ?? parsed.subjects.find((s) => s.key === key)?.name ?? key;
  const weekly = parsed.subjects.filter((subject) =>
    parsed.blocks.some((b) => b.subjectKey === subject.key)
  );
  const punctual = parsed.subjects.filter((subject) =>
    parsed.sessions.some((session) => session.subjectKey === subject.key)
  );
  const subjectCard = (subject: DuocTimetable['subjects'][number], index: number, items: {
    key: string;
    label: string;
    a11y: string;
  }[]) => {
    const on = included(subject.key);
    return (
      <Reveal key={subject.key} index={index}>
        <View style={s.card}>
          <Check
            label={on ? 'Incluir este ramo' : 'Ramo quitado'}
            a11yLabel={`Incluir ${nameOf(subject.key)}`}
            checked={on}
            onToggle={() => toggle(subject.key)}
          />
          <View style={!on && i.excluded}>
            <PlannerField
              label='Nombre del ramo'
              value={nameOf(subject.key)}
              maxLength={120}
              onChangeText={(name) =>
                onChange({
                  ...selection,
                  subjectNames: { ...selection.subjectNames, [subject.key]: name },
                })}
            />
          </View>
          <Text style={i.meta}>{subject.code} · Sección {subject.section}</Text>
          {items.map((item) => (
            <Check
              key={item.key}
              label={item.label}
              a11yLabel={item.a11y}
              checked={on && included(item.key)}
              disabled={!on}
              onToggle={() => toggle(item.key)}
            />
          ))}
        </View>
      </Reveal>
    );
  };
  return (
    <View style={i.section}>
      <PlannerField
        label='Nombre del semestre'
        value={selection.semesterName}
        maxLength={80}
        onChangeText={(semesterName) => onChange({ ...selection, semesterName })}
      />
      {weekly.length > 0 && <Text style={i.sectionTitle} accessibilityRole='header'>Clases semanales</Text>}
      {weekly.map((subject, index) =>
        subjectCard(
          subject,
          index,
          parsed.blocks.map((block, n) => ({ block, key: blockKey(n) }))
            .filter(({ block }) => block.subjectKey === subject.key)
            .map(({ block, key }) => {
              const day = WEEKDAYS[block.weekday - 1];
              const time = `${block.startsAt}–${block.endsAt}`;
              return {
                key,
                label: `${day} ${time}${block.room ? ` · ${block.room}` : ''}`,
                a11y: `${day} de ${block.startsAt} a ${block.endsAt}${
                  block.room ? `, sala ${block.room}` : ''
                }`,
              };
            }),
        )
      )}
      {punctual.length > 0 && (
        <>
          <Text style={i.sectionTitle} accessibilityRole='header'>Clases en fechas puntuales</Text>
          <Text style={s.subtitle}>
            Estos ramos no tienen clases todas las semanas. Cada fecha se guarda como una actividad
            en tu agenda.
          </Text>
        </>
      )}
      {punctual.map((subject, index) =>
        subjectCard(
          subject,
          weekly.length + index,
          parsed.sessions.map((session, n) => ({ session, key: sessionKey(n) }))
            .filter(({ session }) => session.subjectKey === subject.key)
            .map(({ session, key }) => ({
              key,
              label: `${dateLabel(session.date)} · ${session.startsAt}–${session.endsAt}`,
              a11y: `${dateLabel(session.date)}, de ${session.startsAt} a ${session.endsAt}`,
            })),
        )
      )}
    </View>
  );
}
