import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  daysSinceApplication,
  formatDaysAgo,
  isStressTestDue,
} from '@/features/emotional-checkin/domain/stressTestRecency';
import { useStressTestLauncher } from '@/features/emotional-checkin/hooks/useStressTestLauncher';
import { NotificationsModal, type AppNotification } from '../components/NotificationsModal';
import {
  dismissNotification,
  getDismissedNotificationIds,
} from '../infrastructure/dismissedNotificationsStorage';
import { BottomNav } from '@/shared/components/BottomNav';
import { LiquidBackground, LiquidCard } from '@/shared/components/Glass';
import { WeekChart, type WeekDayData } from '@/shared/components/WeekChart';
import { BellIcon, ClipboardIcon, SparkleIcon, WindIcon } from '@/shared/components/Icons';
import {
  SAMPLE_CURRENT_CLASS,
  SAMPLE_UPCOMING,
  SAMPLE_WEEK_INSIGHT,
  type UpcomingKind,
} from '../domain/dashboardSample';
import { greetingName, studentInitials } from '../domain/studentName';
import {
  fetchStudentDisplayName,
  type StudentDisplayName,
} from '../infrastructure/studentProfileRepository';
import { styles } from './DashboardScreen.styles';

/* Datos de muestra hasta que el histórico real esté disponible */
const SAMPLE_WEEK: WeekDayData[] = [
  { day: 'L', mood: 'Bien', value: 62 },
  { day: 'M', mood: 'Muy bien', value: 78 },
  { day: 'X', mood: 'Neutro', value: 48 },
  { day: 'J', mood: 'Mal', value: 30 },
  { day: 'V', mood: 'Bien', value: 66 },
  { day: 'S', mood: 'Muy bien', value: 85 },
  { day: 'D', mood: 'Bien', value: 58 },
];

const WEEKDAYS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MONTHS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

/* Lunes = 0 ... domingo = 6, igual que las columnas del gráfico semanal */
function todayWeekIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function formatToday(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} DE ${MONTHS[date.getMonth()]}`;
}

const BADGE_STYLE = {
  exam: 'dateBadgeExam',
  delivery: 'dateBadgeDelivery',
  oral: 'dateBadgeOral',
} as const satisfies Record<UpcomingKind, keyof typeof styles>;

const BADGE_TEXT_STYLE = {
  exam: 'dateTextExam',
  delivery: 'dateTextDelivery',
  oral: 'dateTextOral',
} as const satisfies Record<UpcomingKind, keyof typeof styles>;

const NAME_TIMEOUT_MS = 5000;
const SPINNER_DELAY_MS = 400;

export default function DashboardScreen() {
  const router = useRouter();
  const now = new Date();
  const currentClass = SAMPLE_CURRENT_CLASS;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[] | null>(null);
  const [student, setStudent] = useState<StudentDisplayName | null>(null);
  // La vista espera al nombre para que el saludo no cambie después de aparecer.
  const [nameLoaded, setNameLoaded] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const { lastStressTest, goToTest } = useStressTestLauncher();

  useEffect(() => {
    void getDismissedNotificationIds().then(setDismissedIds);

    let active = true;
    // Si la red tarda demasiado se muestra "Hola" para no dejar la vista bloqueada.
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), NAME_TIMEOUT_MS));
    // Sin sesión o sin perfil el saludo queda en "Hola", sin nombre inventado.
    void Promise.race([fetchStudentDisplayName(), timeout])
      .catch(() => null)
      .then((name) => {
        if (!active) return;
        setStudent(name);
        setNameLoaded(true);
      });
    // El indicador solo aparece si la espera se nota; una carga rápida no parpadea.
    const spinnerTimer = setTimeout(() => active && setShowSpinner(true), SPINNER_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(spinnerTimer);
    };
  }, []);

  const firstName = greetingName(student?.firstName);
  const initials = studentInitials(student?.firstName, student?.lastName);

  const handleDismiss = (id: string) => {
    setDismissedIds((ids) => [...(ids ?? []), id]);
    void dismissNotification(id);
  };

  const allNotifications: AppNotification[] = [];
  // Solo se avisa cuando el historial se pudo consultar; sin sesión no se sabe si falta el test.
  if (lastStressTest.status === 'ready' && isStressTestDue(lastStressTest.lastAppliedAt, now)) {
    const { lastAppliedAt } = lastStressTest;
    allNotifications.push({
      // La id incluye la última fecha: si se descarta, vuelve a aparecer recién
      // cuando el estudiante responda el test y vuelvan a pasar 30 días.
      id: `stress-test-due:${lastAppliedAt ?? 'never'}`,
      title: 'Haz tu Test Estrés Percibido de este mes',
      description: lastAppliedAt
        ? `Lo respondiste por última vez ${formatDaysAgo(daysSinceApplication(lastAppliedAt, now))}.`
        : 'Aún no lo has respondido. Toma 3 minutos.',
      icon: <ClipboardIcon size={22} color="#b4561a" />,
      onPress: () => {
        setNotificationsOpen(false);
        goToTest();
      },
    });
  }
  // Hasta leer las descartadas no se muestra nada, para que el punto no parpadee.
  const notifications =
    dismissedIds === null ? [] : allNotifications.filter(({ id }) => !dismissedIds.includes(id));

  if (!nameLoaded) {
    return (
      <View style={styles.safeArea}>
        <LiquidBackground />
        <View style={styles.loadingBox}>
          {showSpinner ? <ActivityIndicator size="large" color="#1a2b44" accessibilityLabel="Cargando" /> : null}
        </View>
        <BottomNav currentTab="home" />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header: fecha y saludo ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.dateEyebrow}>{formatToday(now)}</Text>
            <Text
              style={styles.greetingTitle}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {firstName ? `Hola, ${firstName}` : 'Hola'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => setNotificationsOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              notifications.length > 0
                ? `Notificaciones, ${notifications.length} nueva${notifications.length === 1 ? '' : 's'}`
                : 'Notificaciones'
            }
          >
            <BellIcon size={20} />
            {notifications.length > 0 ? <View style={styles.bellDot} /> : null}
          </TouchableOpacity>
          <View style={styles.avatarCircle} accessibilityLabel={firstName ? `Perfil de ${firstName}` : 'Perfil'}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        </View>

        {/* ── Vistazo de tu semana ── */}
        <LiquidCard style={styles.weekCard}>
          <View style={styles.weekCardHeader}>
            <Text style={styles.weekCardTitle}>Vistazo de tu semana</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.weekCardLink}>Ver detalle →</Text>
            </TouchableOpacity>
          </View>
          <WeekChart data={SAMPLE_WEEK} todayIndex={todayWeekIndex(now)} />
          <View style={styles.insightBox}>
            <View style={styles.insightIcon}>
              <SparkleIcon size={16} color="#d4912c" />
            </View>
            <View style={styles.insightTextBox}>
              <Text style={styles.insightText}>
                <Text style={styles.insightStrong}>{SAMPLE_WEEK_INSIGHT.highlight}</Text>{' '}
                {SAMPLE_WEEK_INSIGHT.message}
              </Text>
            </View>
          </View>
        </LiquidCard>

        {/* ── Clase en curso ── */}
        <View style={styles.classCard}>
          <View style={styles.classTopRow}>
            <View style={styles.classBadge}>
              <View style={styles.classBadgeDot} />
              <Text style={styles.classBadgeText}>En clase ahora</Text>
            </View>
            <Text style={styles.classRemaining}>Termina en {currentClass.minutesLeft} min</Text>
          </View>
          <Text style={styles.className}>{currentClass.name}</Text>
          <Text style={styles.classMeta}>
            {currentClass.time} · {currentClass.place} · {currentClass.teacher}
          </Text>
          <View
            style={styles.progressTrack}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: currentClass.progress }}
          >
            <View style={[styles.progressFill, { width: `${currentClass.progress}%` }]} />
          </View>
          <View style={styles.classBottomRow}>
            <Text style={styles.classNext}>
              Luego · <Text style={styles.classNextStrong}>{currentClass.next.name}</Text>{' '}
              {currentClass.next.time}
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.classLink}>Ver día →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Se viene ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Se viene</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionLink}>Todo →</Text>
          </TouchableOpacity>
        </View>
        <LiquidCard style={styles.upcomingCard}>
          {SAMPLE_UPCOMING.map((item, index) => (
            <View
              key={item.id}
              style={[styles.upcomingRow, index > 0 && styles.upcomingRowDivider]}
            >
              <View style={[styles.dateBadge, styles[BADGE_STYLE[item.kind]]]}>
                <Text style={[styles.dateWeekday, styles[BADGE_TEXT_STYLE[item.kind]]]}>
                  {item.weekday}
                </Text>
                <Text style={[styles.dateDay, styles[BADGE_TEXT_STYLE[item.kind]]]}>{item.day}</Text>
              </View>
              <View style={styles.upcomingText}>
                <Text style={styles.upcomingTitle}>{item.title}</Text>
                <Text style={styles.upcomingDetail}>{item.detail}</Text>
              </View>
              <View style={[styles.whenChip, item.urgent ? styles.whenChipUrgent : styles.whenChipCalm]}>
                <Text style={[styles.whenText, item.urgent ? styles.whenTextUrgent : styles.whenTextCalm]}>
                  {item.when}
                </Text>
              </View>
            </View>
          ))}
        </LiquidCard>

        {/* ── Para ti hoy ── */}
        <Text style={[styles.sectionTitle, styles.forYouTitle]}>Para ti hoy</Text>
        <View style={styles.forYouRow}>
          <TouchableOpacity
            style={[styles.forYouTile, styles.forYouBreathe]}
            onPress={() => router.push('/wellness')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Respira 3 minutos"
          >
            <WindIcon size={26} color="#6b5aa8" />
            <Text style={styles.forYouTitleText}>Respira 3 min</Text>
            <Text style={styles.forYouDesc}>Antes de tu prueba de mañana</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/wellness/crisis-resources')}
          activeOpacity={0.7}
          accessibilityRole="button"
          style={styles.supportLink}
        >
          <Text style={styles.supportLinkText}>¿Necesitas hablar con alguien? Ver recursos de apoyo →</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav currentTab="home" />
      <NotificationsModal
        visible={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onDismiss={handleDismiss}
      />
    </View>
  );
}
