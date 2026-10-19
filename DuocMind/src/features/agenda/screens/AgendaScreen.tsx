import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import { LiquidBackground } from '@/shared/components/Glass';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { CalendarIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import { useEvents } from '@/shared/events/application/useEvents';
import { eventTypeStyle } from '@/shared/events/components/eventTypeStyle';
import { eventDateKey, eventTime } from '@/shared/events/domain/institutionalEvent';
import { type PlannerModel, usePlanner } from '@/shared/planner/application/usePlanner';
import type { PersonalActivity } from '@/shared/planner/application/plannerStore';
import { isDate, type ScheduleDocument } from '@/shared/planner/domain/schedule';
import {
  addDays,
  civilNow,
  classesOnDate,
  dateWeekday,
  WEEKDAYS,
} from '@/shared/planner/domain/weeklySchedule';
import {
  personalActivityEnd,
  personalActivityState,
} from '@/shared/planner/domain/personalActivityTime';
import { composeAgendaItems } from '../application/agendaItems';
import { AgendaActivityCard } from '../components/AgendaActivityCard';
import { AgendaClassCard } from '../components/AgendaClassCard';
import { AgendaEventCard } from '../components/AgendaEventCard';
import { AgendaTimelineRow } from '../components/AgendaTimelineRow';
import { AgendaWeekStrip } from '../components/AgendaWeekStrip';
import { PlannerButton, PlannerField, PlannerModal } from '../components/PlannerControls';
import { PersonalActivityForm } from '../components/PersonalActivityForm';
import { PlannerSyncNotice } from '../components/PlannerSyncNotice';
import { ClassScheduleForm } from '../components/ClassScheduleForm';
import { styles } from './AgendaScreen.styles';
import { scheduleStyles as s } from './ScheduleScreen.styles';

export default function AgendaScreen() {
  const planner = usePlanner();
  const session = planner.snapshot?.session;
  return (
    <AgendaScreenContent
      key={session ? `${session.userId}:${session.generation}` : 'signed-out'}
      planner={planner}
    />
  );
}
function AgendaScreenContent({ planner }: { planner: PlannerModel }) {
  const params = useLocalSearchParams<{ date?: string }>(),
    router = useRouter(),
    events = useEvents();
  const today = civilNow(planner.now).date;
  const [selectedDate, setSelectedDate] = useState(() => isDate(params.date) ? params.date : today),
    [dateForm, setDateForm] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ activity?: PersonalActivity } | null>(null),
    [classForm, setClassForm] = useState<ScheduleDocument | null>(null),
    [deleting, setDeleting] = useState<PersonalActivity | null>(null);
  useEffect(() => {
    if (isDate(params.date)) setSelectedDate(params.date);
  }, [params.date]);
  const document = planner.snapshot?.document,
    doc = document?.working,
    activities = document?.activities ?? [],
    catalog = events.snapshot?.document.catalog ?? null,
    interests = events.snapshot?.document.interests ?? [];
  const classes = doc ? classesOnDate(doc, selectedDate, planner.now) : [],
    items = composeAgendaItems(activities, interests, catalog, selectedDate, planner.now, classes);
  const monday = addDays(selectedDate, 1 - dateWeekday(selectedDate));
  const week = Array.from({ length: 7 }, (_, index) => {
    const key = addDays(monday, index);
    return {
      key,
      weekday: WEEKDAYS[index].slice(0, 3).toUpperCase(),
      number: Number(key.slice(8)),
      busy: composeAgendaItems(
        activities,
        interests,
        catalog,
        key,
        planner.now,
        doc ? classesOnDate(doc, key, planner.now) : [],
      ).length > 0,
    };
  });
  const format = (date: string) =>
    new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`));
  const active = doc?.semesters.find((semester) => semester.id === doc.activeSemesterId),
    loading = planner.loading || events.loading;
  const subjectIds = new Set(
    doc?.subjects.filter((subject) => subject.semesterId === active?.id).map((subject) =>
      subject.id
    ),
  );
  const blockCount = doc?.blocks.filter((block) => subjectIds.has(block.subjectId)).length ?? 0;
  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Reveal>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title} accessibilityRole='header'>Mi agenda</Text>
              <Text style={styles.subtitle}>Tus clases, actividades y eventos guardados.</Text>
            </View>
            <PlannerButton label='Eventos' secondary onPress={() => router.push('/events')} />
          </View>
        </Reveal>
        <Reveal index={1}>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeading}>
              <View style={styles.scheduleIcon}>
                <CalendarIcon size={24} />
              </View>
              <View style={styles.scheduleText}>
                <Text style={styles.scheduleEyebrow}>TU HORARIO DE CLASES</Text>
                <Text style={styles.scheduleTitle}>
                  {planner.loading
                    ? 'Cargando tu horario…'
                    : blockCount
                    ? active?.name
                    : 'Agrega tus clases a la agenda'}
                </Text>
              </View>
            </View>
            <Text style={styles.scheduleDescription}>
              {blockCount
                ? `${subjectIds.size} ${subjectIds.size === 1 ? 'ramo' : 'ramos'} · ${blockCount} ${
                  blockCount === 1 ? 'bloque semanal' : 'bloques semanales'
                }`
                : 'Escribe tus ramos, elige los días y las horas. Tus clases se repetirán cada semana.'}
            </Text>
            <View style={styles.scheduleActions}>
              <ScalePress
                style={[styles.schedulePrimary, (!doc || planner.busy) && s.disabled]}
                disabled={!doc || planner.busy}
                onPress={() => {
                  if (doc) setClassForm(doc);
                }}
                accessibilityRole='button'
                accessibilityLabel={blockCount ? 'Agregar clases' : 'Crear mi horario'}
              >
                <Text style={styles.schedulePrimaryText}>
                  {blockCount ? '+ Agregar clases' : 'Crear mi horario'}
                </Text>
              </ScalePress>
              {active && (
                <ScalePress
                  style={styles.scheduleEdit}
                  onPress={() => router.push('/schedule')}
                  accessibilityRole='button'
                  accessibilityLabel='Editar horario y semestres'
                >
                  <Text style={styles.scheduleEditText}>Editar horario →</Text>
                </ScalePress>
              )}
            </View>
          </View>
        </Reveal>
        <PlannerSyncNotice planner={planner} />
        <AgendaWeekStrip
          title={`${format(monday)} – ${format(addDays(monday, 6))}`}
          days={week}
          selectedKey={selectedDate}
          todayKey={today}
          onSelect={setSelectedDate}
          onPrevious={() => setSelectedDate(addDays(selectedDate, -7))}
          onNext={() => setSelectedDate(addDays(selectedDate, 7))}
        />
        <View style={s.row}>
          <PlannerButton
            label='Elegir fecha'
            secondary
            onPress={() => {
              setDateForm(selectedDate);
              setError(null);
            }}
          />
          <PlannerButton label='Hoy' secondary onPress={() => setSelectedDate(today)} />
        </View>
        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderText}>
            <Text style={styles.dayTitle}>
              {selectedDate === today ? 'Hoy' : WEEKDAYS[dateWeekday(selectedDate) - 1]}
            </Text>
            <Text style={styles.dayMeta}>{format(selectedDate)}</Text>
            {!loading && (
              <Text style={styles.dayCount}>
                {items.length} {items.length === 1 ? 'actividad' : 'actividades'}
              </Text>
            )}
          </View>
          <PlannerButton
            label='Agregar actividad'
            disabled={!document}
            onPress={() => setForm({})}
          />
        </View>
        <ScalePress
          style={styles.activitiesLink}
          accessibilityRole='button'
          accessibilityLabel='Ver mis actividades'
          onPress={() => router.push('/pendientes')}
        >
          <Text style={styles.scheduleEditText}>Ver todas mis actividades →</Text>
        </ScalePress>
        {events.snapshot?.warning && <Text style={styles.notice}>{events.snapshot.warning}</Text>}
        {events.error && (
          <Text style={styles.statusMessage} accessibilityRole='alert'>
            Eventos: {events.error}
          </Text>
        )}
        {events.message && <Text style={styles.notice}>{events.message}</Text>}
        {error && !dateForm && !deleting && <Text style={styles.statusMessage}>{error}</Text>}
        {loading && <GotaLoader text='Cargando tu día…' />}
        <View>
          {items.map((item, index) => {
            const last = index === items.length - 1;
            if (item.kind === 'event') {
              const event = item.projection.event,
                singleDay = eventDateKey(event.startsAt) === eventDateKey(event.endsAt);
              return (
                <Reveal key={`event-${item.id}`} index={index}>
                  <AgendaTimelineRow
                    start={item.continuation ? 'Sigue' : eventTime(event.startsAt)}
                    end={singleDay && !item.continuation ? eventTime(event.endsAt) : undefined}
                    dotColor={eventTypeStyle(event.type).dot}
                    isLast={last}
                  >
                    <AgendaEventCard
                      item={item}
                      now={planner.now}
                      model={events}
                      onOpen={() =>
                        router.push({ pathname: '/events/[id]', params: { id: event.id } })}
                    />
                  </AgendaTimelineRow>
                </Reveal>
              );
            }
            if (item.kind === 'class') {
              const occurrence = item.occurrence;
              return (
                <Reveal key={`class-${item.id}`} index={index}>
                  <AgendaTimelineRow
                    start={occurrence.block.startsAt}
                    end={occurrence.block.endsAt}
                    dotColor={occurrence.state === 'in-progress' ? '#10a875' : '#6b5aa8'}
                    isLast={last}
                  >
                    <AgendaClassCard
                      occurrence={occurrence}
                      onOpen={() =>
                        router.push({
                          pathname: '/schedule-subject',
                          params: { id: occurrence.subject.id },
                        })}
                    />
                  </AgendaTimelineRow>
                </Reveal>
              );
            }
            const activity = item.activity,
              inProgress = personalActivityState(activity, planner.now) === 'in-progress';
            return (
              <Reveal key={`activity-${item.id}`} index={index}>
                <AgendaTimelineRow
                  start={activity.time}
                  end={personalActivityEnd(activity.time, activity.endTime)}
                  dotColor={inProgress ? '#10a875' : '#f2c14e'}
                  isLast={last}
                >
                  <AgendaActivityCard
                    activity={activity}
                    inProgress={inProgress}
                    onOpen={() => setForm({ activity })}
                    onRemove={() => {
                      setDeleting(activity);
                      setError(null);
                    }}
                  />
                </AgendaTimelineRow>
              </Reveal>
            );
          })}
        </View>
        {!loading && !items.length && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Este día está libre</Text>
            <Text style={styles.emptyText}>
              Agrega una actividad, configura tus clases o guarda un evento.
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomNav currentTab='agenda' />
      {classForm && (
        <ClassScheduleForm
          planner={planner}
          base={classForm}
          weekday={dateWeekday(selectedDate)}
          onClose={() => setClassForm(null)}
          onSaved={(weekday) => {
            setClassForm(null);
            setSelectedDate(addDays(selectedDate, (weekday - dateWeekday(selectedDate) + 7) % 7));
          }}
        />
      )}
      {form && (
        <PersonalActivityForm
          planner={planner}
          date={selectedDate}
          activity={form.activity}
          onClose={() => setForm(null)}
          onSaved={setSelectedDate}
        />
      )}
      {dateForm !== null && (
        <PlannerModal
          title='Elegir fecha'
          busy={false}
          onClose={() => setDateForm(null)}
        >
          <PlannerField
            label='Fecha para consultar'
            value={dateForm}
            placeholder='AAAA-MM-DD'
            maxLength={10}
            onChangeText={setDateForm}
          />
          {error && <Text style={s.error}>{error}</Text>}
          <PlannerButton
            label='Ver fecha'
            onPress={() => {
              if (isDate(dateForm)) {
                setSelectedDate(dateForm);
                setDateForm(null);
                setError(null);
              } else setError('Escribe una fecha válida en formato AAAA-MM-DD.');
            }}
          />
        </PlannerModal>
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
              void planner.removeActivity(deleting.id, deleting.version).then(() =>
                setDeleting(null)
              ).catch((e) => setError(e.message))}
          />
        </PlannerModal>
      )}
    </View>
  );
}
