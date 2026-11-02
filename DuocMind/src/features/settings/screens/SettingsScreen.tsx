import React, { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { LiquidBackground, LiquidCard } from '@/shared/components/Glass';
import { ScalePress } from '@/shared/components/ScalePress';
import { CONSENT_TEXT, type ConsentKey } from '@/shared/consents/domain/consents';
import { openPrivacyPolicy } from '@/shared/consents/infrastructure/privacyPolicyDocument';
import { Reveal } from '@/shared/motion/Reveal';
import { useConsentSettings } from '../application/useConsentSettings';
import { useStudentProfile } from '../application/useStudentProfile';
import { displayValue, type StudentProfileDetails } from '../domain/studentProfile';
import { styles } from './SettingsScreen.styles';

const CONSENT_KEYS: ConsentKey[] = ['shareAnonymousData', 'allowEmergencyContact'];

function profileRows(profile: StudentProfileDetails): { label: string; value: string }[] {
  return [
    { label: 'Nombre', value: profile.fullName },
    { label: 'Correo', value: displayValue(profile.email) },
    { label: 'Teléfono', value: displayValue(profile.phone) },
    { label: 'Carrera', value: displayValue(profile.career) },
    { label: 'RUT', value: displayValue(profile.rut) },
  ];
}

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useConsentSettings();
  const studentProfile = useStudentProfile();
  const [policyFailed, setPolicyFailed] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/dashboard');
  };

  const handleOpenPolicy = async () => {
    setPolicyFailed(false);
    try {
      await openPrivacyPolicy();
    } catch {
      setPolicyFailed(true);
    }
  };

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <ScalePress
            style={styles.backButton}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={styles.backArrow}>←</Text>
          </ScalePress>
          <Text style={styles.topBarTitle}>MI PERFIL</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>Tus datos</Text>
          <Text style={styles.subtitle}>Esta es la información con la que te registraste.</Text>
        </View>

        {studentProfile.loading ? (
          <View style={styles.loading}>
            <GotaLoader size="sm" text="Cargando tu perfil…" />
          </View>
        ) : studentProfile.failed ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            No pudimos cargar tus datos. Revisa tu conexión e inténtalo de nuevo.
          </Text>
        ) : studentProfile.profile ? (
          <Reveal index={0}>
            <LiquidCard style={styles.card}>
              {profileRows(studentProfile.profile).map((row, index, rows) => (
                <View
                  key={row.label}
                  accessible
                  accessibilityLabel={`${row.label}: ${row.value}`}
                  style={[styles.profileRow, index < rows.length - 1 && styles.profileRowDivider]}
                >
                  <Text style={styles.profileLabel}>{row.label}</Text>
                  <Text style={styles.profileValue}>{row.value}</Text>
                </View>
              ))}
            </LiquidCard>
          </Reveal>
        ) : (
          <Text style={styles.notice}>Todavía no completas tu perfil de estudiante.</Text>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tus consentimientos</Text>
          <Text style={styles.subtitle}>
            Estos permisos son opcionales. Puedes activarlos o desactivarlos cuando quieras.
          </Text>
        </View>

        {settings.loading ? (
          <View style={styles.loading}>
            <GotaLoader size="sm" text="Cargando tus permisos…" />
          </View>
        ) : settings.unavailable ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            No pudimos cargar tus permisos. Cierra esta pantalla e inténtalo de nuevo.
          </Text>
        ) : (
          <>
            <LiquidCard style={styles.card}>
              {CONSENT_KEYS.map((key, index) => (
                <View
                  key={key}
                  style={[styles.row, index < CONSENT_KEYS.length - 1 && styles.profileRowDivider]}
                >
                  <Text style={styles.consentText}>{CONSENT_TEXT[key]}</Text>
                  <Switch
                    value={settings.choices[key]}
                    onValueChange={(value) => settings.setConsent(key, value)}
                    trackColor={{ false: '#d9d2bd', true: '#1a2b44' }}
                    thumbColor="#ffffff"
                    accessibilityRole="switch"
                    accessibilityLabel={CONSENT_TEXT[key]}
                    accessibilityState={{ checked: settings.choices[key] }}
                  />
                </View>
              ))}
              <ScalePress
                style={styles.link}
                onPress={handleOpenPolicy}
                accessibilityRole="link"
                accessibilityLabel="Leer términos, políticas y consentimientos en detalle"
              >
                <Text style={styles.linkText}>Leer términos, políticas y consentimientos</Text>
              </ScalePress>
            </LiquidCard>

            {settings.saveFailed ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                No se pudo guardar el cambio. Inténtalo de nuevo.
              </Text>
            ) : null}
            {policyFailed ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                No pudimos abrir el documento de consentimientos. Inténtalo de nuevo.
              </Text>
            ) : null}
            <Text style={styles.notice}>Por ahora tu elección se guarda en este dispositivo.</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
