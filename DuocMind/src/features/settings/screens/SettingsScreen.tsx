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
import { styles } from './SettingsScreen.styles';

const CONSENTS: { key: ConsentKey; title: string }[] = [
  { key: 'shareAnonymousData', title: 'Datos anónimos para estadísticas' },
  { key: 'allowEmergencyContact', title: 'Contacto en caso de emergencia' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useConsentSettings();
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
          <Text style={styles.topBarTitle}>CONFIGURACIÓN</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>Tus permisos</Text>
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
            {CONSENTS.map((consent, index) => (
              <Reveal key={consent.key} index={index}>
                <LiquidCard style={styles.card}>
                  <View style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{consent.title}</Text>
                      <Text style={styles.rowBody}>{CONSENT_TEXT[consent.key]}</Text>
                    </View>
                    <Switch
                      value={settings.choices[consent.key]}
                      onValueChange={(value) => settings.setConsent(consent.key, value)}
                      trackColor={{ false: '#d9d2bd', true: '#1a2b44' }}
                      thumbColor="#ffffff"
                      accessibilityRole="switch"
                      accessibilityLabel={consent.title}
                      accessibilityState={{ checked: settings.choices[consent.key] }}
                    />
                  </View>
                  {consent.key === 'shareAnonymousData' ? (
                    <ScalePress
                      style={styles.link}
                      onPress={handleOpenPolicy}
                      accessibilityRole="link"
                      accessibilityLabel="Leer los consentimientos en detalle"
                    >
                      <Text style={styles.linkText}>Leer los consentimientos</Text>
                    </ScalePress>
                  ) : null}
                </LiquidCard>
              </Reveal>
            ))}

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
