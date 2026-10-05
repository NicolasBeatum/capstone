import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import type { AgendaActivity } from '../domain/agendaActivity';
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

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentWeek(date: Date): Date[] {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

function formatSelectedDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export default function AgendaScreen() {
  const today = new Date();
  const weekDays = useMemo(() => getCurrentWeek(today), []);
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [activities, setActivities] = useState<AgendaActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [time, setTime] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const selectedDay = weekDays.find((day) => toDateKey(day) === selectedDate) ?? today;
  const dayActivities = activities
    .filter((activity) => activity.date === selectedDate)
    .sort((left, right) => left.time.localeCompare(right.time));

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setTime('');
    setErrorMessage(null);
  };

  const addActivity = async () => {
    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();
    if (!cleanTitle || !cleanSubject || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      setErrorMessage('Ingresa una actividad, asignatura y hora válida (HH:MM).');
      return;
    }

    const activity: AgendaActivity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: selectedDate,
      title: cleanTitle,
      subject: cleanSubject,
      time: time.trim(),
    };

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await saveAgendaActivity(activity);
      setActivities((current) => [...current, activity]);
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
          <Text style={styles.weekTitle}>Esta semana</Text>
          <View style={styles.weekRow}>
            {weekDays.map((day) => {
              const dateKey = toDateKey(day);
              const isSelected = selectedDate === dateKey;
              return (
                <TouchableOpacity
                  key={dateKey}
                  style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                  onPress={() => setSelectedDate(dateKey)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`${WEEKDAY_LABELS[day.getDay()]} ${day.getDate()}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                    {WEEKDAY_LABELS[day.getDay()]}
                  </Text>
                  <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
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
            {dayActivities.length} {dayActivities.length === 1 ? 'actividad' : 'actividades'}
          </Text>
        </View>

        {errorMessage && !isModalVisible && (
          <Text style={styles.statusMessage} accessibilityRole="alert">{errorMessage}</Text>
        )}

        {isLoading ? (
          <ActivityIndicator size="large" color="#1a2b44" />
        ) : dayActivities.length > 0 ? (
          dayActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <Text style={styles.activityTime}>{activity.time}</Text>
              <View style={styles.activityAccent} />
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activitySubject}>{activity.subject}</Text>
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
          ))
        ) : (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>Tu día está despejado</Text>
            <Text style={styles.emptyText}>
              Agrega una actividad y asóciala a una de tus asignaturas para verla aquí.
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
            <Text style={styles.modalSubtitle}>Para el {formatSelectedDate(selectedDay)}</Text>

            <Text style={styles.fieldLabel}>Actividad</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ej. Repasar para la prueba"
              placeholderTextColor="#a39b8b"
              style={styles.input}
              maxLength={80}
              returnKeyType="next"
            />
            <Text style={styles.fieldLabel}>Asignatura</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Ej. Programación Web"
              placeholderTextColor="#a39b8b"
              style={styles.input}
              maxLength={60}
              returnKeyType="next"
            />
            <Text style={styles.fieldLabel}>Hora (24 horas)</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="09:30"
              placeholderTextColor="#a39b8b"
              style={styles.input}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              returnKeyType="done"
            />
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
                style={styles.saveButton}
                onPress={() => void addActivity()}
                disabled={isSaving}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.saveText}>{isSaving ? 'Guardando…' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
