import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomNav } from '@/shared/components/BottomNav';
import { GlassCard, LiquidBackground } from '@/shared/components/Glass';
import { GotaLoader } from '@/shared/components/GotaLoader';
import {
  getAgendaActivityEndTime,
  getAgendaActivityStatus,
  getVisibleAgendaActivities,
  type AgendaActivity,
} from '../domain/agendaActivity';
import {
  deleteAgendaActivity,
  getAgendaActivities,
  saveAgendaActivity,
} from '../infrastructure/agendaStorage';
import { styles } from './AgendaScreen.styles';

const WEEKDAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const SUBJECTS = [
  'Base de datos',
  'Programacion web',
  'Etica Profesional',
  'Ingles Avanzado',
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
  const [now, setNow] = useState(() => new Date());
  const todayKey = toDateKey(now);
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const weekDays = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    return getUpcomingDays(new Date(year, month - 1, day));
  }, [selectedDate]);
  const [activities, setActivities] = useState<AgendaActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    const intervalId = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (selectedDate < todayKey) setSelectedDate(todayKey);
  }, [selectedDate, todayKey]);

  useEffect(() => {
    let isMounted = true;
    void getAgendaActivities()
      .then((storedActivities) => {
        if (isMounted) setActivities(storedActivities);
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar la agenda.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

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
  const dayActivities = getVisibleAgendaActivities(activities, selectedDate, now);

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
      await saveAgendaActivity(activity);
      setActivities((current) => [...current, activity]);
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
      await deleteAgendaActivity(activity.id);
      setActivities((current) => current.filter((item) => item.id !== activity.id));
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo eliminar la actividad.');
    }
  };

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>ORGANIZA TU SEMANA</Text>
        <Text style={styles.title}>Mi agenda</Text>
        <Text style={styles.subtitle}>Tus actividades y pendientes por asignatura.</Text>

        <GlassCard style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <TouchableOpacity
              style={styles.weekArrow}
              onPress={() => {
                const previousWeek = new Date(selectedDay);
                previousWeek.setDate(previousWeek.getDate() - 7);
                if (toDateKey(previousWeek) >= todayKey) setSelectedDate(toDateKey(previousWeek));
              }}
              disabled={toDateKey(new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate() - 7)) < todayKey}
              accessibilityRole="button"
              accessibilityLabel="Semana anterior"
            >
              <Text style={styles.weekArrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.weekTitle}>Semana de {formatSelectedDate(weekDays[0])}</Text>
            <TouchableOpacity
              style={styles.weekArrow}
              onPress={() => {
                const nextWeek = new Date(selectedDay);
                nextWeek.setDate(nextWeek.getDate() + 7);
                setSelectedDate(toDateKey(nextWeek));
              }}
              accessibilityRole="button"
              accessibilityLabel="Semana siguiente"
            >
              <Text style={styles.weekArrowText}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekRow}>
            {weekDays.map((day) => {
              const dateKey = toDateKey(day);
              const isSelected = selectedDate === dateKey;
              const isPast = dateKey < todayKey;
              return (
                <TouchableOpacity
                  key={dateKey}
                  style={[
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
                    isPast && styles.dayButtonPast,
                  ]}
                  onPress={() => setSelectedDate(dateKey)}
                  disabled={isPast}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`${WEEKDAY_LABELS[day.getDay()]} ${day.getDate()}`}
                  accessibilityState={{ selected: isSelected, disabled: isPast }}
                >
                  <Text style={[styles.dayName, isSelected && styles.dayNameSelected, isPast && styles.dayTextPast]}>
                    {WEEKDAY_LABELS[day.getDay()]}
                  </Text>
                  <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected, isPast && styles.dayTextPast]}>
                    {day.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setIsModalVisible(true);
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Agregar actividad"
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Agregar actividad</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{formatSelectedDate(selectedDay)}</Text>
          <Text style={styles.count}>
            {dayActivities.length} {dayActivities.length === 1 ? 'actividad pendiente' : 'actividades pendientes'}
          </Text>
        </View>

        {errorMessage && !isModalVisible && (
          <Text style={styles.statusMessage} accessibilityRole="alert">{errorMessage}</Text>
        )}

        {isLoading ? (
          <GotaLoader text="Respira mientras cargamos…" />
        ) : dayActivities.length > 0 ? (
          dayActivities.map((activity) => {
            const isInProgress = getAgendaActivityStatus(activity, now) === 'in-progress';
            const endTime = getAgendaActivityEndTime(activity.time);
            return (
              <View key={activity.id} style={styles.activityCard}>
                <Text style={styles.activityTime}>{activity.time}{'\n'}{endTime}</Text>
                <View style={[styles.activityAccent, isInProgress && styles.activityAccentActive]} />
                <View style={styles.activityDetails}>
                  {isInProgress && (
                    <Text style={styles.inProgressLabel}>OCURRIENDO AHORA</Text>
                  )}
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  {activity.subject ? (
                    <Text style={styles.activitySubject}>{activity.subject}</Text>
                  ) : (
                    <Text style={styles.activityNoSubject}>Sin asignatura</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => void removeActivity(activity)}
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${activity.title}`}
                >
                  <Text style={styles.deleteText}>Quitar</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>No tienes actividades pendientes</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán las actividades que todavía no han comenzado o que estén ocurriendo ahora.
            </Text>
          </GlassCard>
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
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setIsCalendarOpen((isOpen) => !isOpen)}
                activeOpacity={0.8}
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
              </TouchableOpacity>

              {isCalendarOpen && (
                <View style={styles.calendarPanel}>
                  <View style={styles.calendarMonthHeader}>
                    <TouchableOpacity
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
                    </TouchableOpacity>
                    <Text style={styles.calendarMonthTitle}>{monthTitle}</Text>
                    <TouchableOpacity
                      style={styles.calendarMonthArrow}
                      onPress={() => changeCalendarMonth(1)}
                      accessibilityRole="button"
                      accessibilityLabel="Mes siguiente"
                    >
                      <Text style={styles.calendarMonthArrowText}>›</Text>
                    </TouchableOpacity>
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
                          <TouchableOpacity
                            style={[
                              styles.calendarDayButton,
                              isSelected && styles.calendarDayButtonSelected,
                              isDisabled && styles.calendarDayButtonDisabled,
                            ]}
                            onPress={() => selectCalendarDate(day)}
                            disabled={isDisabled}
                            activeOpacity={0.75}
                            accessibilityRole="button"
                            accessibilityLabel={`${day} de ${MONTHS[calendarMonth.getMonth()]}`}
                            accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                          >
                            <Text style={[
                              styles.calendarDayText,
                              isSelected && styles.calendarDayTextSelected,
                              isDisabled && styles.calendarDayTextDisabled,
                            ]}>{day}</Text>
                          </TouchableOpacity>
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
                        <TouchableOpacity
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
                          activeOpacity={0.75}
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
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <Text style={styles.fieldLabel}>Asignatura (opcional)</Text>
              <View style={styles.subjectOptions} accessibilityRole="radiogroup">
                {[null, ...SUBJECTS].map((option) => {
                  const isSelected = subject === option;
                  return (
                    <TouchableOpacity
                      key={option ?? 'none'}
                      style={styles.subjectRow}
                      onPress={() => {
                        setSubject(option);
                        setErrorMessage(null);
                      }}
                      activeOpacity={0.75}
                      accessibilityRole="radio"
                      accessibilityLabel={option ?? 'Sin asignatura'}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.subjectRowText}>{option ?? 'Sin asignatura'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {errorMessage && (
                <Text style={styles.statusMessage} accessibilityRole="alert">{errorMessage}</Text>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsModalVisible(false);
                    setErrorMessage(null);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={() => void addActivity()}
                  disabled={isSaving}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={styles.saveText}>{isSaving ? 'Guardando…' : 'Confirmar actividad'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
