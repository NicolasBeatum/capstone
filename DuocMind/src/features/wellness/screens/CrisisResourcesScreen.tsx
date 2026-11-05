import React, { useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import {
  CalendarIcon,
  ChatIcon,
  ChevronDownIcon,
  CloseIcon,
  HandsHeartIcon,
  HeartIcon,
  PhoneIcon,
  SparkleIcon,
} from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import { styles } from './CrisisResourcesScreen.styles';

const BOOKING_URL = 'https://agenda.achs.cl/booking/step-1';

const MAIN_LINE = { label: 'Salud Responde', phone: '600 360 7777' };

const MORE_LINES = [
  { label: 'Línea de prevención del suicidio', desc: 'Atención confidencial, 24/7', phone: '141' },
  { label: 'SAMU', desc: 'Emergencias de salud', phone: '131' },
  { label: 'Carabineros', desc: 'Emergencias', phone: '133' },
];

const PROGRAM_BENEFITS = [
  { icon: ChatIcon, title: 'Atención psicológica gratuita', detail: undefined },
  { icon: SparkleIcon, title: 'Charlas de bienestar', detail: undefined },
  {
    icon: HandsHeartIcon,
    title: 'Sé Promotor/a del Bienestar',
    detail: 'Fórmate y descubre sus beneficios',
  },
];

const handleOpenBooking = () => {
  Linking.openURL(BOOKING_URL).catch(() => {
    Alert.alert('No se pudo abrir el enlace', `Intenta nuevamente desde tu navegador: ${BOOKING_URL}`);
  });
};

const handleCall = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  Linking.openURL(`tel:${digits}`).catch(() => {
    Alert.alert('No se pudo iniciar la llamada', `Puedes marcar directamente al ${phone}.`);
  });
};

export default function CrisisResourcesScreen() {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>CM</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Estamos contigo</Text>
            <Text style={styles.headerSubtitle}>Bienestar y apoyo</Text>
          </View>
        </View>
        <ScalePress
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <CloseIcon size={22} />
        </ScalePress>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Reveal>
          <Text style={styles.title}>Cuidar de ti también es importante</Text>
          <Text style={styles.intro}>
            Si estás pasando por un momento difícil, no tienes que enfrentarlo solo/a. Aquí puedes
            pedir ayuda cuando lo necesites.
          </Text>
        </Reveal>

        {/* ── Programa de Apoyo a la Salud Mental ── */}
        <Reveal index={1}>
          <View style={styles.programCard}>
            <View style={styles.programHeader}>
              <View style={styles.programIconBox}>
                <HeartIcon size={26} color="#d69a2d" />
              </View>
              <View style={styles.programHeaderText}>
                <View style={styles.programBadge}>
                  <Text style={styles.programBadgeText}>En alianza con ACHS</Text>
                </View>
                <Text style={styles.programTitle}>Programa de Apoyo a la Salud Mental</Text>
              </View>
            </View>

            <View style={styles.programBody}>
              <Text style={styles.programLead}>
                Pide una hora con un psicólogo o psicóloga, sin costo para ti.
              </Text>

              {PROGRAM_BENEFITS.map(({ icon: Icon, title, detail }) => (
                <View key={title} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <Icon size={20} color="#a4691a" />
                  </View>
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{title}</Text>
                    {detail ? <Text style={styles.benefitDetail}>{detail}</Text> : null}
                  </View>
                </View>
              ))}

              <ScalePress
                style={styles.bookButton}
                onPress={handleOpenBooking}
                accessibilityRole="button"
                accessibilityLabel="Reservar hora con un psicólogo o psicóloga"
              >
                <CalendarIcon size={20} color="#ffffff" />
                <Text style={styles.bookButtonText}>Reservar hora</Text>
              </ScalePress>

              <Text style={styles.programNote}>
                Más información en la APP Vivo Duoc, sección Bienestar
              </Text>
            </View>
          </View>
        </Reveal>

        {/* ── Conversar ahora ── */}
        <Reveal index={2}>
          <View style={styles.callCard}>
            <View style={styles.callHeader}>
              <View style={styles.callIconBox}>
                <PhoneIcon size={22} color="#2f5aa3" />
              </View>
              <View style={styles.callHeaderText}>
                <Text style={styles.callTitle}>¿Prefieres conversar ahora?</Text>
                <Text style={styles.callDesc}>{MAIN_LINE.label} te acompaña, 24/7.</Text>
              </View>
            </View>

            <ScalePress
              style={styles.callButton}
              onPress={() => handleCall(MAIN_LINE.phone)}
              accessibilityRole="button"
              accessibilityLabel={`Llamar a ${MAIN_LINE.label}, ${MAIN_LINE.phone}`}
            >
              <Text style={styles.callButtonText}>Llamar al {MAIN_LINE.phone}</Text>
            </ScalePress>

            <View style={styles.callFooter}>
              <Text style={styles.callFooterText}>Emergencias: 131 · 133</Text>
              <ScalePress
                style={styles.moreButton}
                onPress={() => setShowMore((value) => !value)}
                accessibilityRole="button"
                accessibilityState={{ expanded: showMore }}
                accessibilityLabel={showMore ? 'Ocultar otras líneas' : 'Ver más líneas'}
              >
                <Text style={styles.moreButtonText}>Más líneas</Text>
                <View style={showMore ? styles.chevronOpen : undefined}>
                  <ChevronDownIcon size={18} />
                </View>
              </ScalePress>
            </View>

            {showMore ? (
              <View style={styles.moreList}>
                {MORE_LINES.map((line) => (
                  <ScalePress
                    key={line.phone}
                    style={styles.moreRow}
                    onPress={() => handleCall(line.phone)}
                    accessibilityRole="button"
                    accessibilityLabel={`Llamar a ${line.label}, ${line.phone}`}
                  >
                    <View style={styles.moreRowText}>
                      <Text style={styles.moreRowTitle}>{line.label}</Text>
                      <Text style={styles.moreRowDesc}>{line.desc}</Text>
                    </View>
                    <Text style={styles.moreRowPhone}>{line.phone}</Text>
                  </ScalePress>
                ))}
              </View>
            ) : null}
          </View>
        </Reveal>
      </ScrollView>

      <BottomNav currentTab="checkin" />
    </View>
  );
}
