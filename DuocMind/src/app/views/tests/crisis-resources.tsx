import React from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import {
  ChatIcon,
  HeartIcon,
  PhoneIcon,
  SirenIcon,
} from '@/shared/components/icons';
import { styles } from '@/shared/styles/daily-test.styles';

const BOOKING_URL = 'https://agenda.achs.cl/booking/step-1';

interface CrisisResource {
  icon: 'phone' | 'chat' | 'siren';
  title: string;
  phone: string;
  description: string;
}

const URGENT_RESOURCES: CrisisResource[] = [
  {
    icon: 'phone',
    title: 'Línea de prevención del suicidio (MINSAL)',
    phone: '141',
    description: 'Atención confidencial 24/7, todos los días.',
  },
  {
    icon: 'chat',
    title: 'Salud Responde',
    phone: '600 360 7777',
    description: 'Orientación en salud del Ministerio de Salud, disponible 24/7.',
  },
  {
    icon: 'siren',
    title: 'Emergencias',
    phone: '131 - 133',
    description: 'SAMU (131) y Carabineros (133) ante una emergencia inmediata.',
  },
];

const RESOURCE_ICONS = {
  phone: PhoneIcon,
  chat: ChatIcon,
  siren: SirenIcon,
};

const handleOpenBooking = () => {
  Linking.openURL(BOOKING_URL).catch(() => {
    Alert.alert('No se pudo abrir el enlace', `Intenta nuevamente desde tu navegador: ${BOOKING_URL}`);
  });
};

export default function CrisisResourcesScreen() {
  const router = useRouter();

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>CM</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Estamos contigo</Text>
            <Text style={styles.headerSubtitle}>Apoyo inmediato</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.crisisContainer} showsVerticalScrollIndicator={false}>
        {/* ── Tarjeta principal ── */}
        <View style={styles.crisisHeroCard}>
          <View style={styles.crisisIconCircle}>
            <HeartIcon size={26} />
          </View>
          <View style={styles.crisisHeroText}>
            <Text style={styles.crisisHeroTitle}>Tu bienestar importa</Text>
            <Text style={styles.crisisHeroDesc}>
              Tus respuestas indican que podrías estar sintiendo un alto nivel de malestar
              emocional. No estás solo/a, hay personas y recursos disponibles para ayudarte.
            </Text>
          </View>
        </View>

        {/* ── Recursos de ayuda inmediata ── */}
        <View style={styles.crisisSectionCard}>
          <Text style={styles.crisisSectionTitle}>Busca ayuda ahora</Text>
          <Text style={styles.crisisSectionDesc}>
            Puedes comunicarte con profesionales de forma gratuita y confidencial.
          </Text>

          {URGENT_RESOURCES.map((resource) => {
            const Icon = RESOURCE_ICONS[resource.icon];
            return (
              <View key={resource.title} style={styles.crisisRow}>
                <View style={styles.crisisRowIconCircle}>
                  <Icon size={20} />
                </View>
                <View style={styles.crisisRowText}>
                  <Text style={styles.crisisRowTitle}>{resource.title}</Text>
                  <Text style={styles.crisisRowPhone}>{resource.phone}</Text>
                  <Text style={styles.crisisRowDesc}>{resource.description}</Text>
                </View>
                <Text style={styles.crisisRowArrow}>→</Text>
              </View>
            );
          })}
        </View>

        {/* ── Programa de Apoyo a la Salud Mental ── */}
        <View style={styles.programCard}>
          <View style={styles.programCardHeader}>
            <View style={styles.programIconCircle}>
              <HeartIcon size={22} />
            </View>
            <Text style={styles.programCardTitle}>Programa de Apoyo a la Salud Mental</Text>
          </View>
          <Text style={styles.referralText}>
            Con programas diseñados para apoyarte, desde charlas hasta atención psicológica
            gratuita, creamos una comunidad donde el bienestar es primordial. Fórmate como
            Promotor/a del Bienestar y descubre sus beneficios personales. Tu bienestar importa.
          </Text>
          <Text style={styles.referralText}>
            ¡Prioriza tu bienestar! Reserva tu cita para atención psicológica en el siguiente
            enlace.
          </Text>
          <TouchableOpacity style={styles.programButton} onPress={handleOpenBooking} activeOpacity={0.85}>
            <Text style={styles.programButtonText}>Reservar hora →</Text>
          </TouchableOpacity>
          <Text style={styles.resourceDesc}>
            Infórmate de más apoyos ingresando a la APP Vivo Duoc, sección Bienestar y Salud
            Mental.
          </Text>
        </View>

        {/* ── Volver ── */}
        <View style={styles.crisisDivider}>
          <View style={styles.crisisDividerLine} />
          <Text style={styles.crisisDividerText}>
            SI SIENTES QUE ESTÁS EN PELIGRO INMEDIATO, POR FAVOR LLAMA AL 131
          </Text>
          <View style={styles.crisisDividerLine} />
        </View>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => router.replace('/views/home')}
          activeOpacity={0.85}
        >
          <PhoneIcon size={16} />
          <Text style={styles.outlineButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav currentTab="checkin" />
    </View>
  );
}
