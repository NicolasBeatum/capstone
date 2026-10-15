import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import { useEvents } from '@/shared/events/application/useEvents';
import { eventTypeStyle } from '@/shared/events/components/eventTypeStyle';
import { eventDateKey, eventTime, isDateKey } from '@/shared/events/domain/institutionalEvent';
import { composeAgendaItems } from '../application/agendaItems';
import { useAgendaActivities } from '../application/useAgendaActivities';
import { useSubjectCatalog } from '../application/useSubjectCatalog';
import { AgendaActivityCard } from '../components/AgendaActivityCard';
import { AgendaEventCard } from '../components/AgendaEventCard';
import { AgendaTimelineRow } from '../components/AgendaTimelineRow';
import { AgendaWeekStrip, type WeekStripDay } from '../components/AgendaWeekStrip';
import { BottomNav } from '@/shared/components/BottomNav';
import { LiquidBackground } from '@/shared/components/Glass';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { PlusIcon, TicketIcon } from '@/shared/components/Icons';
import {
  getAgendaActivityEndTime,
  getAgendaActivityStatus,
  type AgendaActivity,
} from '../domain/agendaActivity';
import { styles } from './AgendaScreen.styles';

const WEEKDAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const TIME_BLOCKS = Array.from({ length: 16 }, (_, index) => {
  const hour = index + 8;
  const start = `${String(hour).padStart(2, '0')}:00`;
  return {
    start,
    end: getAgendaActivityEndTime(start),
  };
});

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getUpcomingDays(date: Date): Date[] {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  firstDay.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(firstDay);
    day.setDate(firstDay.getDate() + index);
    return day;
  });
}

function formatSelectedDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export default function AgendaScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const router = useRouter();
  const personal = useAgendaActivities();
  const events = useEvents();
  const subjects = useSubjectCatalog();
  const { activities, loading: isLoading } = personal;
  const [now, setNow] = useState(() => new Date());
  const todayKey = toDateKey(now);
  const [selectedDate, setSelectedDate] = useState(() => isDateKey(params.date) ? params.date : toDateKey(new Date()));
  const weekDays = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    return getUpcomingDays(new Date(year, month - 1, day));
  }, [selectedDate]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<string | null>(null);
  const [activityDate, setActivityDate] = useState(() => toDateKey(new Date()));
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isDateKey(params.date)) setSelectedDate(params.date);
  }, [params.date]);
  useEffect(() => setNow(events.now), [events.now]);

  const selectedDay = new Date(
    Number(selectedDate.slice(0, 4)),
    Number(selectedDate.slice(5, 7)) - 1,
    Number(selectedDate.slice(8, 10)),
  );
  const activityDay = new Date(
    Number(activityDate.slice(0, 4)),
    Number(activityDate.slice(5, 7)) - 1,
    Number(activityDate.slice(8, 10)),
  );
  const monthTitle = `${MONTHS[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;
  const monthStartOffset = (new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInCalendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarCells: Array<number | null> = [
    ...Array.from({ length: monthStartOffset }, () => null),
    ...Array.from({ length: daysInCalendarMonth }, (_, index) => index + 1),
  ];
  const dayItems = composeAgendaItems(activities, events.snapshot?.document.interests ?? [], events.snapshot?.document.catalog ?? null, selectedDate, now);

  const resetForm = () => {
    setTitle('');
    setSubject(null);
    setSelectedBlock(null);
    const initialDate = selectedDate >= todayKey ? selectedDate : todayKey;
    setActivityDate(initialDate);
    const [year, month, day] = initialDate.split('-').map(Number);
    setCalendarMonth(new Date(year, month - 1, 1));
    setIsCalendarOpen(false);
    setErrorMessage(null);
  };

  const isBlockAvailable = (start: string): boolean => (
    getAgendaActivityStatus({ date: activityDate, time: start }, now) !== 'ended'
  );

  const changeCalendarMonth = (offset: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const previousMonthAvailable = (
    calendarMonth.getFullYear() > now.getFullYear() ||
    calendarMonth.getMonth() > now.getMonth()
  );

  const selectCalendarDate = (day: number) => {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const dateKey = toDateKey(date);
    if (dateKey < todayKey) return;
    setActivityDate(dateKey);
    setSelectedBlock(null);
    setErrorMessage(null);
  };

  const addActivity = async () => {
    const submittedAt = new Date();
    setNow(submittedAt);
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('Escribe el nombre de la actividad.');
      return;
    }
    if (activityDate < toDateKey(submittedAt)) {
      setErrorMessage('Selecciona una fecha igual o posterior a hoy.');
      return;
    }
    if (!selectedBlock) {
      setErrorMessage('Selecciona un bloque horario en el calendario.');
      return;
    }
    if (getAgendaActivityStatus({ date: activityDate, time: selectedBlock }, submittedAt) === 'ended') {
      setErrorMessage('Ese bloque ya terminó. Selecciona una hora futura.');
      return;
    }

    const activity: AgendaActivity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: activityDate,
      title: cleanTitle,
      subject,
      time: selectedBlock,
    };

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await personal.save(activity);
      setSelectedDate(activityDate);
      setNow(new Date());
      setIsModalVisible(false);
      resetForm();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la actividad.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeActivity = async (activity: AgendaActivity) => {
    setErrorMessage(null);
    try {
      await personal.remove(activity.id);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo eliminar la actividad.');
    }
  };

  const interests = events.snapshot?.document.interests ?? [];
  const catalog = events.snapshot?.document.catalog ?? null;
  const stripDays: WeekStripDay[] = weekDays.map((day) => {
    const key = toDateKey(day);
    return {
      key,
      weekday: WEEKDAY_LABELS[day.getDay()],
      number: day.getDate(),
      busy: composeAgendaItems(activities, interests, catalog, key, now).length > 0,
    };
  });
  const weekFirst = weekDays[0];
  const weekLast = weekDays[6];
  const weekTitle = weekFirst.getMonth() === weekLast.getMonth()
    ? `${weekFirst.getDate()} – ${weekLast.getDate()} de ${MONTHS[weekLast.getMonth()]}`
    : `${weekFirst.getDate()} ${MONTHS[weekFirst.getMonth()].slice(0, 3)} – ${weekLast.getDate()} ${MONTHS[weekLast.getMonth()].slice(0, 3)}`;
  const isToday = selectedDate === todayKey;
  const shiftWeek = (days: number) => {
    const target = new Date(selectedDay);
    target.setDate(target.getDate() + days);
    setSelectedDate(toDateKey(target));
  };
  const openNewActivity = () => {
    resetForm();
    setIsModalVisible(true);
  };
  const stillLoading = isLoading || events.loading;

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Reveal>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title} accessibilityRole="header">Mi agenda</Text>
              <Text style={styles.subtitle}>Tus actividades y los eventos que guardaste.</Text>
            </View>
            <ScalePress style={styles.roundButton} onPress={() => router.push('/events')} accessibilityRole="button" accessibilityLabel="Explorar eventos">
              <TicketIcon size={21} />
            </ScalePress>
          </View>
        </Reveal>

        <Reveal index={1}>
          <AgendaWeekStrip
            title={weekTitle}
            days={stripDays}
            selectedKey={selectedDate}
            todayKey={todayKey}
            onSelect={setSelectedDate}
            onPrevious={() => shiftWeek(-7)}
            onNext={() => shiftWeek(7)}
          />
        </Reveal>

        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderText}>
            <Text style={styles.dayTitle}>{isToday ? 'Hoy' : WEEKDAY_NAMES[selectedDay.getDay()]}</Text>
            <Text style={styles.dayMeta}>
              {isToday ? `${WEEKDAY_NAMES[selectedDay.getDay()]} ` : ''}{formatSelectedDate(selectedDay)}
            </Text>
            {!stillLoading && (
              <Text style={styles.dayCount}>
                {dayItems.length === 0 ? 'Sin actividades' : `${dayItems.length} ${dayItems.length === 1 ? 'actividad' : 'actividades'}`}
              </Text>
            )}
          </View>
          <ScalePress style={styles.addButton} onPress={openNewActivity} accessibilityRole="button" accessibilityLabel="Agregar actividad">
            <PlusIcon size={18} color="#f2c14e" />
            <Text style={styles.addButtonText}>Actividad</Text>
          </ScalePress>
        </View>

        {errorMessage && !isModalVisible && (
          <Text style={styles.statusMessage} accessibilityRole="alert">{errorMessage}</Text>
        )}
        {personal.error && <Text style={styles.statusMessage} accessibilityRole="alert">Actividades personales: {personal.error}</Text>}
        {events.snapshot?.warning && <Text style={styles.notice} accessibilityLiveRegion="polite">{events.snapshot.warning}</Text>}
        {events.error && <Text style={styles.statusMessage} accessibilityRole="alert">Eventos: {events.error}</Text>}
        {events.message && <Text style={styles.notice} accessibilityLiveRegion="polite">{events.message}</Text>}
        {stillLoading && <GotaLoader text="Respira mientras cargamos…" />}

        <View>
          {dayItems.map((item, index) => {
            const isLast = index === dayItems.length - 1;
            if (item.kind === 'event') {
              const event = item.projection.event;
              const singleDay = eventDateKey(event.startsAt) === eventDateKey(event.endsAt);
              return <Reveal key={`event-${item.id}`} index={index}>
                <AgendaTimelineRow
                  start={item.continuation ? 'Sigue' : eventTime(event.startsAt)}
                  end={singleDay && !item.continuation ? eventTime(event.endsAt) : undefined}
                  dotColor={eventTypeStyle(event.type).dot}
                  isLast={isLast}
                >
                  <AgendaEventCard item={item} now={now} model={events} onOpen={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })} />
                </AgendaTimelineRow>
              </Reveal>;
            }
            const activity = item.activity;
            const inProgress = getAgendaActivityStatus(activity, now) === 'in-progress';
            return <Reveal key={`activity-${activity.id}`} index={index}>
              <AgendaTimelineRow start={activity.time} end={getAgendaActivityEndTime(activity.time)} dotColor={inProgress ? '#10a875' : '#f2c14e'} isLast={isLast}>
                <AgendaActivityCard activity={activity} inProgress={inProgress} onRemove={() => void removeActivity(activity)} />
              </AgendaTimelineRow>
            </Reveal>;
          })}
        </View>

        {!stillLoading && dayItems.length === 0 && !personal.error && !events.error && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{isToday ? 'Hoy tienes el día libre' : 'Este día está libre'}</Text>
            <Text style={styles.emptyText}>Agrega una actividad o guarda un evento para verlo aquí.</Text>
            <ScalePress style={styles.emptyButton} onPress={openNewActivity} accessibilityRole="button" accessibilityLabel="Agregar actividad">
              <Text style={styles.emptyButtonText}>Agregar actividad</Text>
            </ScalePress>
          </View>
        )}
      </ScrollView>
      <BottomNav currentTab="agenda" />

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva actividad</Text>
            <Text style={styles.modalSubtitle}>Elige un nombre, una fecha y una hora para tu actividad.</Text>
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.fieldLabel}>Nombre de la actividad</Text>
              <TextInput
                value={title}
                onChangeText={(value) => {
                  setTitle(value);
                  setErrorMessage(null);
                }}
                placeholder="Ej. Repasar para la prueba"
                placeholderTextColor="#a39b8b"
                style={styles.input}
                maxLength={80}
                returnKeyType="done"
                blurOnSubmit
                accessibilityLabel="Nombre de la actividad"
              />

              <Text style={styles.fieldLabel}>Fecha y hora</Text>
              <ScalePress
                style={styles.datePickerButton}
                onPress={() => setIsCalendarOpen((isOpen) => !isOpen)}

                accessibilityRole="button"
                accessibilityLabel="Elegir fecha y hora"
                accessibilityState={{ expanded: isCalendarOpen }}
              >
                <View style={styles.datePickerButtonText}>
                  <Text style={styles.datePickerValue}>{formatSelectedDate(activityDay)}</Text>
                  <Text style={styles.datePickerHint}>
                    {selectedBlock
                      ? `${selectedBlock}–${getAgendaActivityEndTime(selectedBlock)}`
                      : 'Selecciona una hora'}
                  </Text>
                </View>
                <Text style={styles.datePickerChevron}>{isCalendarOpen ? '⌃' : '⌄'}</Text>
              </ScalePress>

              {isCalendarOpen && (
                <View style={styles.calendarPanel}>
                  <View style={styles.calendarMonthHeader}>
                    <ScalePress
                      style={styles.calendarMonthArrow}
                      onPress={() => changeCalendarMonth(-1)}
                      disabled={!previousMonthAvailable}
                      accessibilityRole="button"
                      accessibilityLabel="Mes anterior"
                      accessibilityState={{ disabled: !previousMonthAvailable }}
                    >
                      <Text style={[
                        styles.calendarMonthArrowText,
                        !previousMonthAvailable && styles.calendarMonthArrowDisabled,
                      ]}>‹</Text>
                    </ScalePress>
                    <Text style={styles.calendarMonthTitle}>{monthTitle}</Text>
                    <ScalePress
                      style={styles.calendarMonthArrow}
                      onPress={() => changeCalendarMonth(1)}
                      accessibilityRole="button"
                      accessibilityLabel="Mes siguiente"
                    >
                      <Text style={styles.calendarMonthArrowText}>›</Text>
                    </ScalePress>
                  </View>
                  <View style={styles.calendarGrid}>
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((weekday, index) => (
                      <View key={`weekday-${index}`} style={styles.calendarCell}>
                        <Text style={styles.calendarWeekday}>{weekday}</Text>
                      </View>
                    ))}
                    {calendarCells.map((day, index) => {
                      if (day === null) {
                        return <View key={`blank-${index}`} style={styles.calendarCell} />;
                      }
                      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                      const dateKey = toDateKey(date);
                      const isSelected = activityDate === dateKey;
                      const isDisabled = dateKey < todayKey;
                      return (
                        <View key={dateKey} style={styles.calendarCell}>
                          <ScalePress
                            style={[
                              styles.calendarDayButton,
                              isSelected && styles.calendarDayButtonSelected,
                              isDisabled && styles.calendarDayButtonDisabled,
                            ]}
                            onPress={() => selectCalendarDate(day)}
                            disabled={isDisabled}

                            accessibilityRole="button"
                            accessibilityLabel={`${day} de ${MONTHS[calendarMonth.getMonth()]}`}
                            accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                          >
                            <Text style={[
                              styles.calendarDayText,
                              isSelected && styles.calendarDayTextSelected,
                              isDisabled && styles.calendarDayTextDisabled,
                            ]}>{day}</Text>
                          </ScalePress>
                        </View>
                      );
                    })}
                  </View>

                  <Text style={styles.fieldLabel}>Bloque de una hora</Text>
                  <View style={styles.optionGrid}>
                    {TIME_BLOCKS.map((block) => {
                      const isSelected = selectedBlock === block.start;
                      const isAvailable = isBlockAvailable(block.start);
                      return (
                        <ScalePress
                          key={block.start}
                          style={[
                            styles.optionChip,
                            isSelected && styles.optionChipSelected,
                            !isAvailable && styles.optionChipDisabled,
                          ]}
                          onPress={() => {
                            setSelectedBlock(block.start);
                            setErrorMessage(null);
                          }}
                          disabled={!isAvailable}

                          accessibilityRole="button"
                          accessibilityLabel={`${block.start} a ${block.end}`}
                          accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
                        >
                          <Text style={[
                            styles.optionChipText,
                            isSelected && styles.optionChipTextSelected,
                            !isAvailable && styles.optionChipTextDisabled,
                          ]}>
                            {block.start}–{block.end}
                          </Text>
                        </ScalePress>
                      );
                    })}
                  </View>
                </View>
              )}

              <Text style={styles.fieldLabel}>Asignatura (opcional)</Text>
              {subjects.loading && <GotaLoader size="sm" text="Cargando tus asignaturas…" style={styles.subjectStatusLoader} />}
              {subjects.failed && (
                <Text style={styles.subjectStatus}>No pudimos cargar tus asignaturas. Puedes guardar sin asignatura.</Text>
              )}
              {subjects.stale && (
                <Text style={styles.subjectStatus}>Sin conexión: lista guardada, puede no estar al día.</Text>
              )}
              {!subjects.loading && !subjects.failed && subjects.options.length === 0 && (
                <Text style={styles.subjectStatus}>Aún no tienes asignaturas inscritas.</Text>
              )}
              <View style={styles.subjectOptions} accessibilityRole="radiogroup">
                {[{ key: 'none', label: 'Sin asignatura', value: null as string | null }, ...subjects.options].map((option) => {
                  const isSelected = subject === option.value;
                  return (
                    <ScalePress
                      key={option.key}
                      style={styles.subjectRow}
                      onPress={() => {
                        setSubject(option.value);
                        setErrorMessage(null);
                      }}

                      accessibilityRole="radio"
                      accessibilityLabel={option.label}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.subjectRowText}>{option.label}</Text>
                    </ScalePress>
                  );
                })}
              </View>

              {errorMessage && (
                <Text style={styles.statusMessage} accessibilityRole="alert">{errorMessage}</Text>
              )}
              <View style={styles.modalActions}>
                <ScalePress
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsModalVisible(false);
                    setErrorMessage(null);
                  }}

                  accessibilityRole="button"
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </ScalePress>
                <ScalePress
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={() => void addActivity()}
                  disabled={isSaving}

                  accessibilityRole="button"
                >
                  <Text style={styles.saveText}>{isSaving ? 'Guardando…' : 'Confirmar actividad'}</Text>
                </ScalePress>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
