import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import {
  daysSinceApplication,
  formatDaysAgo,
  isStressTestDue,
} from '@/features/emotional-checkin/domain/stressTestRecency';
import { useStressTestLauncher } from '@/features/emotional-checkin/hooks/useStressTestLauncher';
import { useWeekMood } from '@/features/emotional-checkin/hooks/useWeekMood';
import { NotificationsModal, type AppNotification } from '../components/NotificationsModal';
import { ProfileMenuModal, type MenuAnchor } from '../components/ProfileMenuModal';
import { WelcomeIntro, type GreetingTarget } from '../components/WelcomeIntro';
import {
  dismissNotification,
  getDismissedNotificationIds,
} from '../infrastructure/dismissedNotificationsStorage';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { BottomNav } from '@/shared/components/BottomNav';
import { LiquidBackground, LiquidCard } from '@/shared/components/Glass';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { ScalePress } from '@/shared/components/ScalePress';
import { WeekChart, type WeekDayData } from '@/shared/components/WeekChart';
import { Reveal } from '@/shared/motion/Reveal';
import { TutorialOverlay } from '@/shared/tutorial/components/TutorialOverlay';
import { useTutorial } from '@/shared/tutorial/infrastructure/useTutorial';
import { BellIcon, ClipboardIcon, TicketIcon, WindIcon } from '@/shared/components/Icons';
import { usePlanner, type PlannerModel } from '@/shared/planner/application/usePlanner';
import { projectPlannerDashboard } from '@/shared/planner/application/plannerProjection';
import { emptySchedule } from '@/shared/planner/domain/schedule';
import { ACTIVITY_LABELS, type ActivityKind } from '@/shared/planner/application/plannerStore';
import { greetingName, studentInitials } from '../domain/studentName';
import {
  fetchStudentDisplayName,
  type StudentDisplayName,
} from '../infrastructure/studentProfileRepository';
import { styles } from './DashboardScreen.styles';

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/* Lunes = 0 ... domingo = 6, igual que las columnas del gráfico semanal */
function todayWeekIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function formatToday(date: Date): string {
  return `${capitalize(WEEKDAYS[date.getDay()])} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/* Un solo color por tipo: la franja lateral y la etiqueta comparten tono. */
const KIND_RAIL_STYLE = {
  exam: 'railExam',
  task: 'railTask',
  personal: 'railPersonal',
} as const satisfies Record<ActivityKind, keyof typeof styles>;

const KIND_TEXT_STYLE = {
  exam: 'kindTextExam',
  task: 'kindTextTask',
  personal: 'kindTextPersonal',
} as const satisfies Record<ActivityKind, keyof typeof styles>;

type UpcomingItem = ReturnType<typeof projectPlannerDashboard>['upcoming'][number];

/* La lista llega ordenada por fecha: basta con agrupar elementos consecutivos del mismo día. */
function groupByDate(items: UpcomingItem[]): { date: string; items: UpcomingItem[] }[] {
  const groups: { date: string; items: UpcomingItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last?.date === item.date) last.items.push(item);
    else groups.push({ date: item.date, items: [item] });
  }
  return groups;
}

const NAME_TIMEOUT_MS = 5000;
const SPINNER_DELAY_MS = 400;

export default function DashboardScreen() {
  const planner = usePlanner();
  const session = planner.snapshot?.session;
  return <DashboardScreenContent key={session ? `${session.userId}:${session.generation}` : 'signed-out'} planner={planner} />;
}
function DashboardScreenContent({planner}: {planner: PlannerModel}) {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  // Los botones bajan a su propia fila solo si el saludo ya no cabe a su lado.
  const compactHeader = width < 340 || fontScale > 1.15;
  const now = planner.now;
  const plannerView = projectPlannerDashboard(planner.snapshot?.document.working ?? emptySchedule(), planner.snapshot?.document.activities ?? [], now);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const avatarRef = useRef<View>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[] | null>(null);
  const [student, setStudent] = useState<StudentDisplayName | null>(null);
  // La vista espera al nombre para que el saludo no cambie después de aparecer.
  const [nameLoaded, setNameLoaded] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const { lastStressTest, goToTest } = useStressTestLauncher();
  const weekMood = useWeekMood();
  const weekData: WeekDayData[] = weekMood.map((day) => ({
    day: day.label,
    dayName: day.name,
    mood: day.mood,
    value: day.level === null ? null : day.level * 100,
  }));
  // El login llega con ?welcome=1 para mostrar la bienvenida una sola vez.
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const [introVisible, setIntroVisible] = useState(welcome === '1');
  const rootRef = useRef<View>(null);
  const greetingRef = useRef<Text>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Elementos que el tutorial mide y resalta.
  const weekCardRef = useRef<View>(null);
  const eventsRef = useRef<View>(null);
  const agendaRef = useRef<View>(null);
  const wellnessRef = useRef<View>(null);
  const checkinRef = useRef<View>(null);
  const tutorialTargets = useMemo(
    () => ({
      weekCard: weekCardRef,
      events: eventsRef,
      agenda: agendaRef,
      wellness: wellnessRef,
      checkin: checkinRef,
    }),
    [],
  );
  const tutorial = useTutorial();
  // Con el inicio apilado bajo el check-in solo el enfocado muestra el recorrido.
  const isFocused = useIsFocused();

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

  const measureGreeting = useCallback(
    () =>
      new Promise<GreetingTarget | null>((resolve) => {
        const root = rootRef.current;
        const greeting = greetingRef.current;
        if (!root || !greeting) {
          resolve(null);
          return;
        }
        root.measureInWindow((rootX, rootY) => {
          greeting.measureInWindow((x, y, width, height) => {
            resolve(width > 0 && height > 0 ? { x: x - rootX, y: y - rootY } : null);
          });
        });
      }),
    [],
  );

  const handleIntroDone = useCallback(() => {
    setIntroVisible(false);
    // Recargar la página web no debe repetir la bienvenida.
    router.setParams({ welcome: undefined });
    // El tutorial se evalúa solo tras el inicio de sesión, con la bienvenida ya terminada.
    void tutorial.offerAfterLogin();
  }, [router, tutorial.offerAfterLogin]);

  // Los elementos resaltados están arriba y abajo: el recorrido parte desde el inicio.
  const handleStartTutorial = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    requestAnimationFrame(() => tutorial.startManually());
  }, [tutorial.startManually]);

  useEffect(() => {
    if (tutorial.visible && isFocused) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [tutorial.visible, isFocused]);

  // Al volver del check-in sin guardar reaparece el paso del check-in.
  useFocusEffect(
    useCallback(() => {
      tutorial.returnWithoutSaving();
    }, [tutorial.returnWithoutSaving]),
  );

  const handleTutorialPrimary = useCallback(() => {
    const kind = tutorial.view?.primary.kind;
    if (kind === 'next') tutorial.next();
    else if (kind === 'register') {
      // El recorrido espera mientras la persona usa el check-in real.
      if (tutorial.registerNow()) router.push('/checkin');
    } else if (kind === 'finish') tutorial.finish();
  }, [router, tutorial.view, tutorial.next, tutorial.registerNow, tutorial.finish]);

  // El menú se ancla bajo el avatar: se mide su posición real en la ventana.
  const handleOpenProfileMenu = () => {
    avatarRef.current?.measureInWindow((x, y, avatarWidth, avatarHeight) => {
      setMenuAnchor({ top: y + avatarHeight + 8, right: Math.max(width - (x + avatarWidth), 8) });
      setProfileMenuOpen(true);
    });
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabaseAuthGateway.signOut();
      setProfileMenuOpen(false);
      router.replace('/login');
    } catch {
      Alert.alert('No se pudo cerrar sesión', 'Revisa tu conexión e inténtalo nuevamente.');
    } finally {
      setSigningOut(false);
    }
  };

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
          {showSpinner ? <GotaLoader text="Respira mientras cargamos…" /> : null}
        </View>
        {/* Tras el login la navegación aparece junto con el dashboard, no antes del saludo. */}
        {introVisible ? null : <BottomNav currentTab="home" />}
      </View>
    );
  }

  const greeting = firstName ? `Hola, ${firstName}` : 'Hola';

  return (
    <View ref={rootRef} style={styles.safeArea}>
      <LiquidBackground />
      {/* El contenedor termina donde empieza la barra inferior: la burbuja de ayuda se ancla a su borde. */}
      <View style={styles.content}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header: fecha y saludo ── */}
        <Reveal>
          <View style={[styles.headerRow, compactHeader && styles.headerCompact]}>
            <View style={[styles.headerText, compactHeader && styles.headerTextCompact]}>
              <Text style={styles.dateEyebrow}>{formatToday(now)}</Text>
              <Text
                ref={greetingRef}
                // Durante la bienvenida el saludo que viaja ocupa su lugar.
                style={[styles.greetingTitle, introVisible && styles.greetingHidden]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {greeting}
              </Text>
            </View>
            <View style={[styles.headerControls, compactHeader && styles.headerControlsCompact]}>
            <View ref={eventsRef} collapsable={false}>
              <ScalePress
                style={styles.bellButton}
                onPress={() => router.push('/events')}
                accessibilityRole="button"
                accessibilityLabel="Ver calendario de eventos"
              >
                <TicketIcon size={20} />
              </ScalePress>
            </View>
            <ScalePress
              style={styles.bellButton}
              onPress={() => setNotificationsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={
                notifications.length > 0
                  ? `Notificaciones, ${notifications.length} nueva${notifications.length === 1 ? '' : 's'}`
                  : 'Notificaciones'
              }
            >
              <BellIcon size={20} />
              {notifications.length > 0 ? <View style={styles.bellDot} /> : null}
            </ScalePress>
            <ScalePress
              ref={avatarRef}
              style={styles.avatarCircle}
              onPress={handleOpenProfileMenu}
              accessibilityRole="button"
              accessibilityLabel={firstName ? `Perfil de ${firstName}` : 'Perfil'}
              accessibilityHint="Abre el menú con la opción de cerrar sesión"
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </ScalePress>
            </View>
          </View>
        </Reveal>

        {/* ── Vistazo de tu semana ── */}
        <Reveal index={1}>
          <View ref={weekCardRef} collapsable={false}>
          <LiquidCard style={styles.weekCard}>
            <View style={styles.weekCardHeader}>
              <Text style={styles.weekCardTitle}>Vistazo de tu semana</Text>
            </View>
            <WeekChart data={weekData} todayIndex={todayWeekIndex(now)} />
          </LiquidCard>
          </View>
        </Reveal>

        {/* Clases reales del semestre activo; sin clase en curso ni próxima, la tarjeta no aporta y se oculta. */}
        {(planner.loading || !plannerView.semester || plannerView.current.length > 0 || plannerView.next || planner.error || planner.syncError) && <Reveal index={2}>
          <View style={styles.classCard}>
            {planner.loading ? <GotaLoader text="Cargando tu horario…" /> : <>
              <View style={styles.classTopRow}><View style={styles.classBadge}><Text style={styles.classBadgeText}>{plannerView.current.length > 1 ? 'Clases que se cruzan' : plannerView.current.length ? 'En clase ahora' : plannerView.emptyLabel}</Text></View></View>
              {plannerView.current.map(occurrence => <View key={occurrence.id} style={{ marginBottom: 12 }}>
                <Text style={styles.className}>{occurrence.subject.name}</Text>
                <Text style={styles.classMeta}>{[`${occurrence.block.startsAt}–${occurrence.block.endsAt}`, occurrence.block.room, occurrence.block.teacher].filter(Boolean).join(' · ')}</Text>
                <Text style={styles.classRemaining}>Termina en {occurrence.minutesLeft} min</Text>
                <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(occurrence.progress) }}><View style={[styles.progressFill, { width: `${occurrence.progress}%` }]} /></View>
              </View>)}
              {plannerView.next && <><Text style={styles.className}>{plannerView.current.length ? `Luego · ${plannerView.next.subject.name}` : plannerView.next.subject.name}</Text><Text style={styles.classMeta}>{[`${plannerView.next.block.startsAt}–${plannerView.next.block.endsAt}`, plannerView.next.block.room, plannerView.next.block.teacher].filter(Boolean).join(' · ')}</Text></>}
              {!plannerView.current.length && !plannerView.next && <Text style={styles.classMeta}>{plannerView.semester ? `Horario activo: ${plannerView.semester.name}` : 'Agrega tus semestres, ramos y bloques para verlos aquí.'}</Text>}
              {planner.error && <Text style={styles.classMeta}>{planner.error}</Text>}
              {planner.syncError && <Text style={styles.classMeta}>{planner.syncError}</Text>}
              <View style={styles.classBottomRow}><ScalePress style={{ minHeight: 44, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Ver mi horario" onPress={() => router.push(plannerView.semester ? { pathname: '/agenda', params: { date: plannerView.date } } : '/schedule')}><Text style={styles.classLink}>{plannerView.semester ? 'Ver día' : 'Configurar horario'}</Text></ScalePress></View>
            </>}
          </View>
        </Reveal>}

        {/* ── Se viene: línea de tiempo agrupada por día; el día se nombra una vez por grupo ── */}
        <Reveal index={3}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Se viene</Text>
            <ScalePress style={{ minHeight: 44, justifyContent: 'center' }} onPress={() => router.push('/pendientes')} accessibilityRole="button" accessibilityLabel="Ver todas mis actividades"><Text style={styles.sectionLink}>Ver todo</Text></ScalePress>
          </View>
          <LiquidCard style={styles.upcomingCard}>
            {!plannerView.upcoming.length && <Text style={styles.upcomingEmpty}>{planner.loading ? 'Cargando actividades…' : 'Sin pruebas, tareas ni actividades en los próximos días.'}</Text>}
            {groupByDate(plannerView.upcoming).map((group, groupIndex) => {
              const first = group.items[0];
              return (
                <View key={group.date} style={groupIndex > 0 && styles.dayGroupSpaced}>
                  <View style={styles.dayHeader}>
                    <Text style={[styles.dayWhen, first.urgent && styles.dayWhenUrgent]}>{first.when}</Text>
                    <Text style={styles.dayDate}>{`${capitalize(first.weekday)} ${first.day}`}</Text>
                  </View>
                  {group.items.map(item => (
                    <ScalePress
                      key={item.id}
                      style={styles.eventRow}
                      onPress={() => router.push({ pathname: '/agenda', params: { date: item.date } })}
                      accessibilityRole="button"
                      accessibilityLabel={`${ACTIVITY_LABELS[item.kind]}: ${item.title}, ${item.when}, ${item.detail}`}
                      accessibilityHint="Abre ese día en la agenda"
                    >
                      <View style={[styles.eventRail, styles[KIND_RAIL_STYLE[item.kind]]]} />
                      <View style={styles.eventBody}>
                        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
                        <View style={styles.eventMetaRow}>
                          <Text style={[styles.eventKind, styles[KIND_TEXT_STYLE[item.kind]]]}>{ACTIVITY_LABELS[item.kind]}</Text>
                          <Text style={styles.eventDetail} numberOfLines={1}>{item.detail}</Text>
                        </View>
                      </View>
                    </ScalePress>
                  ))}
                </View>
              );
            })}
          </LiquidCard>
        </Reveal>

        {/* ── Para ti hoy ── */}
        <Reveal index={4}>
          <Text style={[styles.sectionTitle, styles.forYouTitle]}>Para ti hoy</Text>
          <ScalePress
            style={styles.forYouTile}
            onPress={() => router.push('/wellness')}
            accessibilityRole="button"
            accessibilityLabel="Respira 3 minutos"
          >
            <View style={styles.forYouIcon}>
              <WindIcon size={24} color="#6b5aa8" />
            </View>
            <View style={styles.forYouText}>
              <Text style={styles.forYouTitleText}>Respira 3 min</Text>
              <Text style={styles.forYouDesc}>Un momento para pausar y respirar</Text>
            </View>
          </ScalePress>
        </Reveal>

        <Reveal index={5}>
          <ScalePress
            onPress={() => router.push('/wellness/crisis-resources')}
            accessibilityRole="button"
            accessibilityLabel="¿Necesitas hablar con alguien? Ver recursos de apoyo"
            style={styles.supportCard}
          >
            {/* Dos voces que se cruzan: habla de conversación, sin íconos de alarma. */}
            <View style={styles.supportMark} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <View style={[styles.supportVoice, styles.supportVoiceA]} />
              <View style={[styles.supportVoice, styles.supportVoiceB]} />
            </View>
            <View style={styles.supportText}>
              <Text style={styles.supportTitle}>¿Necesitas hablar con alguien?</Text>
              <Text style={styles.supportBody}>Hay líneas confidenciales que atienden las 24 horas, todos los días.</Text>
              <View style={styles.supportAction}>
                <Text style={styles.supportActionText}>Ver recursos de apoyo</Text>
              </View>
            </View>
          </ScalePress>
        </Reveal>
      </ScrollView>

      {/* Ayuda siempre a mano, sobre la barra inferior; se oculta mientras corre el recorrido. */}
      {tutorial.visible || introVisible ? null : (
        <View style={styles.helpAnchor} pointerEvents="box-none">
          <ScalePress
            onPress={handleStartTutorial}
            accessibilityRole="button"
            accessibilityLabel="Ver tutorial de la app"
            style={styles.helpBubble}
          >
            <Text style={styles.helpBubbleText}>?</Text>
          </ScalePress>
        </View>
      )}
      </View>

      <BottomNav
        currentTab="home"
        tutorialTargets={{ agenda: agendaRef, wellness: wellnessRef, checkin: checkinRef }}
      />
      <NotificationsModal
        visible={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onDismiss={handleDismiss}
      />
      <ProfileMenuModal
        visible={profileMenuOpen}
        anchor={menuAnchor}
        name={student ? `${student.firstName} ${student.lastName}` : null}
        signingOut={signingOut}
        onClose={() => setProfileMenuOpen(false)}
        onSignOut={handleSignOut}
      />
      <TutorialOverlay
        visible={tutorial.visible && isFocused}
        view={tutorial.view}
        targets={tutorialTargets}
        onPrimary={handleTutorialPrimary}
        onBack={tutorial.back}
        onSkip={tutorial.skip}
        onSystemBack={tutorial.systemBack}
      />
      {introVisible ? (
        <WelcomeIntro
          greeting={greeting}
          textStyle={styles.greetingTitle}
          measureTarget={measureGreeting}
          onDone={handleIntroDone}
        />
      ) : null}
    </View>
  );
}
