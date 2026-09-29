import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import { GlassCard, LiquidBackground, LiquidPanel } from '@/shared/components/glass';
import {
  BellIcon,
  ChatIcon,
  ClipboardIcon,
  HeartIcon,
  LungsIcon,
  MeditationIcon,
  MoonIcon,
  PhoneIcon,
  SparkleIcon,
  SunIcon,
  TimerIcon,
  WaterfallIcon,
} from '@/shared/components/icons';
import { styles } from '@/shared/styles/wellness.styles';

interface WellnessTip {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  iconBg: string;
  buttonLabel?: string;
  buttonColor?: string;
}

export default function WellnessScreen() {
  const router = useRouter();

  const tips: WellnessTip[] = [
    {
      id: 'pomodoro',
      title: 'Técnica Pomodoro',
      desc: 'Para días de alta carga cognitiva. Alterna trabajo concentrado con pausas sin pantallas.',
      icon: <TimerIcon size={22} color="#b95c3b" />,
      iconBg: '#f7dcd2',
      buttonLabel: 'Empezar →',
      buttonColor: '#b95c3b',
    },
    {
      id: 'meditation',
      title: 'Meditación Guiada',
      desc: 'Reduce la ansiedad pre-examen centrando tu atención en la respiración diafragmática.',
      icon: <MeditationIcon size={22} color="#c1912c" />,
      iconBg: '#f6ead0',
      buttonLabel: 'Activar →',
      buttonColor: '#c1912c',
    },
    {
      id: 'sleep',
      title: 'Higiene del Sueño',
      desc: 'Evita trasnochar repasando materia. La memoria se consolida en el sueño profundo.',
      icon: <MoonIcon size={22} color="#6b5fbe" />,
      iconBg: '#e7e2f6',
      buttonLabel: 'Activar →',
      buttonColor: '#6b5fbe',
    },
    {
      id: 'breathing',
      title: 'Respiración 4-7-8',
      desc: 'Ejercicio para calmar la mente: inhala 4 segundos, retén 7 y exhala en 8.',
      icon: <LungsIcon size={22} color="#2f8f84" />,
      iconBg: '#d8ebe7',
      buttonLabel: 'Empezar →',
      buttonColor: '#2f8f84',
    },
    {
      id: 'nature',
      title: 'Sonidos de Naturaleza',
      desc: 'Cascadas, lluvia y viento para acompañar tu concentración o tu descanso.',
      icon: <WaterfallIcon size={22} color="#3d7ea6" />,
      iconBg: '#dce9f2',
      buttonLabel: 'Escuchar →',
      buttonColor: '#3d7ea6',
    },
    {
      id: 'help',
      title: 'Recursos de Ayuda',
      desc: 'Orientación general y ayuda profesional cuando la necesites.',
      icon: <HeartIcon size={22} color="#bd5570" />,
      iconBg: '#f8dee2',
    },
  ];

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header: saludo personalizado ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.greetingTitle}>¡Hola, Camila!</Text>
            <Text style={styles.greetingSubtitle}>Un paso a la vez</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>CM</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
          >
            <BellIcon size={20} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* ── Centro de bienestar: afirmación + test emocional ── */}
        <GlassCard style={styles.centerCard}>
          <Text style={styles.centerCardTitle}>Tu Centro de Bienestar</Text>
          <Text style={styles.centerCardSubtitle}>Herramientas y descanso</Text>

          <LiquidPanel from="#f7e3cd" to="#f2d2b2" radius={16} style={styles.affirmBanner}>
            <View style={styles.affirmIconBox}>
              <SunIcon size={20} color="#b97a3e" />
            </View>
            <Text style={styles.affirmText}>
              <Text style={styles.affirmLabel}>Afirmación del Día: </Text>
              Hoy elijo la paz y la claridad
            </Text>
          </LiquidPanel>

          <LiquidPanel from="#f9e9b8" to="#f3d98a" radius={18} style={styles.testCard}>
            <View style={styles.testCardContent}>
              <Text style={styles.testCardTitle}>Test Emocional Completo</Text>
              <Text style={styles.testCardDesc}>
                Identifica tu bienestar general y revisa cómo va tu semana, con una
                mirada rápida sobre tu estado general.
              </Text>
              <View style={styles.testMetaRow}>
                <Text style={styles.testMetaItem}>⏱ 3 min</Text>
                <Text style={styles.testMetaBullet}>•</Text>
                <Text style={styles.testMetaItem}>4 preguntas</Text>
              </View>
            </View>
            <View style={styles.testIllustration}>
              <SparkleIcon size={10} />
              <ClipboardIcon size={46} />
              <SparkleIcon size={8} color="#e8a93c" />
            </View>
          </LiquidPanel>
        </GlassCard>

        {/* ── Tips personalizados ── */}
        <View style={styles.tipsHeader}>
          <Text style={styles.tipsTitle}>Tips Personalizados</Text>
          <Text style={styles.tipsBadge}>Basado en tu estado</Text>
        </View>

        <View style={styles.tipsGrid}>
          {tips.map((tip) => (
            <View key={tip.id} style={styles.tipCardWrap}>
              <GlassCard style={styles.tipCard}>
                <View style={[styles.tipIconBox, { backgroundColor: tip.iconBg }]}>
                  {tip.icon}
                </View>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDesc}>{tip.desc}</Text>
                {tip.buttonLabel ? (
                  <View style={[styles.tipButton, { backgroundColor: tip.buttonColor }]}>
                    <Text style={styles.tipButtonText}>{tip.buttonLabel}</Text>
                  </View>
                ) : (
                  <View style={styles.resourcesRow}>
                    <View style={styles.resourceItem}>
                      <PhoneIcon size={13} color="#bd5570" />
                      <Text style={styles.resourceLabel}>Líneas</Text>
                    </View>
                    <View style={styles.resourceItem}>
                      <ChatIcon size={13} color="#bd5570" />
                      <Text style={styles.resourceLabel}>Chat</Text>
                    </View>
                  </View>
                )}
              </GlassCard>
            </View>
          ))}
        </View>

        {/* ── Llamado a acción principal ── */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/views/tests/daily-test')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Comenzar test emocional"
        >
          <Text style={styles.ctaText}>Comenzar Test Emocional</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Navegación Inferior */}
      <BottomNav currentTab="wellness" />
    </View>
  );
}
