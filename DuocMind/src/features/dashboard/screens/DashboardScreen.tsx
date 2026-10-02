import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { BottomNav } from '@/shared/components/BottomNav';
import { CountUp } from '@/shared/components/CountUp';
import { FadeIn } from '@/shared/components/FadeIn';
import { Pulse } from '@/shared/components/Pulse';
import { ScalePress } from '@/shared/components/ScalePress';
import { SplitText } from '@/shared/components/SplitText';
import { useReduceMotion } from '@/shared/components/useReduceMotion';
import { LiquidBackground, LiquidCard } from '@/shared/components/Glass';
import { WeekChart, type WeekDayData } from '@/shared/components/WeekChart';
import { BellIcon, ClipboardIcon, SparkleIcon, WindIcon } from '@/shared/components/Icons';
import {
  SAMPLE_CURRENT_CLASS,
  SAMPLE_UPCOMING,
  SAMPLE_WEEK_INSIGHT,
  type UpcomingKind,
} from '../domain/dashboardSample';
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

/* Relleno de la barra de progreso: crece desde 0 hasta el porcentaje actual.
 * Anima `width`, que no admite driver nativo; es una sola barra pequeña. */
function ProgressFill({ percent }: { percent: number }) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(percent);
      return undefined;
    }
    const animation = Animated.timing(progress, {
      toValue: percent,
      duration: 900,
      delay: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [percent, progress, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.progressFill,
        { width: progress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
      ]}
    />
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const now = new Date();
  const currentClass = SAMPLE_CURRENT_CLASS;
  // null mientras carga: así la animación del saludo se reproduce una sola vez
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Si falla la lectura, se usa el saludo genérico.
    supabaseAuthGateway
      .getStudentName()
      .then((name) => {
        if (active) setGreeting(name ? `Hola, ${name.firstName}` : 'Hola');
      })
      .catch(() => {
        if (active) setGreeting('Hola');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header: fecha y saludo ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.dateEyebrow}>{formatToday(now)}</Text>
            {greeting ? (
              <SplitText key={greeting} text={greeting} style={styles.greetingTitle} />
            ) : (
              // Reserva la altura del saludo mientras llega el nombre
              <Text style={[styles.greetingTitle, { opacity: 0 }]}>Hola</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
          >
            <BellIcon size={20} />
            <Pulse style={styles.bellDot} />
          </TouchableOpacity>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>CM</Text>
          </View>
        </View>

        {/* ── Vistazo de tu semana ── */}
        <FadeIn delay={120}>
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
        </FadeIn>

        {/* ── Clase en curso ── */}
        <FadeIn delay={240}>
        <View style={styles.classCard}>
          <View style={styles.classTopRow}>
            <View style={styles.classBadge}>
              <View style={styles.classBadgeDot} />
              <Text style={styles.classBadgeText}>En clase ahora</Text>
            </View>
            <Text style={styles.classRemaining}>
              Termina en <CountUp to={currentClass.minutesLeft} delay={400} /> min
            </Text>
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
            <ProgressFill percent={currentClass.progress} />
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
        </FadeIn>

        {/* ── Se viene ── */}
        <FadeIn delay={360}>
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
        </FadeIn>

        {/* ── Para ti hoy ── */}
        <FadeIn delay={480}>
        <Text style={[styles.sectionTitle, styles.forYouTitle]}>Para ti hoy</Text>
        <View style={styles.forYouRow}>
          <ScalePress
            style={[styles.forYouTile, styles.forYouBreathe]}
            onPress={() => router.push('/wellness')}
            accessibilityRole="button"
            accessibilityLabel="Respira 3 minutos"
          >
            <WindIcon size={26} color="#6b5aa8" />
            <Text style={styles.forYouTitleText}>Respira 3 min</Text>
            <Text style={styles.forYouDesc}>Antes de tu prueba de mañana</Text>
          </ScalePress>
          <ScalePress
            style={[styles.forYouTile, styles.forYouTest]}
            onPress={() => router.push('/daily-test')}
            accessibilityRole="button"
            accessibilityLabel="Test semanal de estrés percibido"
          >
            <ClipboardIcon size={26} color="#b4561a" />
            <Text style={styles.forYouTitleText}>Test semanal</Text>
            <Text style={styles.forYouDesc}>Estrés percibido · 3 min</Text>
          </ScalePress>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/wellness/crisis-resources')}
          activeOpacity={0.7}
          accessibilityRole="button"
          style={styles.supportLink}
        >
          <Text style={styles.supportLinkText}>¿Necesitas hablar con alguien? Ver recursos de apoyo →</Text>
        </TouchableOpacity>
        </FadeIn>
      </ScrollView>

      <BottomNav currentTab="home" />
    </View>
  );
}
