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
import type { EditResult } from '../application/studentProfileEdit';
import { useStudentProfile, type StudentProfile } from '../application/useStudentProfile';
import { ChilePhonePrefix } from '../components/ChileFlag';
import { EditableProfileRow, type EditableField } from '../components/EditableProfileRow';
import { displayValue, type StudentProfileDetails } from '../domain/studentProfile';
import {
  formatPhone,
  nationalPhone,
  sanitizeEmailInput,
  sanitizeNameInput,
  sanitizePhoneInput,
} from '../domain/studentProfileEdit';
import { styles } from './SettingsScreen.styles';

const CONSENT_KEYS: ConsentKey[] = ['shareAnonymousData', 'allowEmergencyContact'];

/* Nombre, correo y teléfono se editan con doble toque; carrera y RUT son de solo lectura. */
function profileRows(profile: StudentProfileDetails, student: StudentProfile): ProfileRow[] {
  return [
    {
      label: 'Nombre',
      value: profile.fullName,
      fields: [
        {
          key: 'names',
          label: 'Nombres',
          initial: profile.names,
          autoCapitalize: 'words',
          autoComplete: 'name',
          sanitize: sanitizeNameInput,
        },
        {
          key: 'surnames',
          label: 'Apellidos',
          initial: profile.surnames,
          autoCapitalize: 'words',
          sanitize: sanitizeNameInput,
        },
      ],
      onSave: (values) => student.updateName(values.names, values.surnames),
    },
    {
      label: 'Correo',
      value: displayValue(profile.email),
      fields: [
        {
          key: 'email',
          label: 'Correo',
          initial: profile.email ?? '',
          placeholder: 'tu.correo@duocuc.cl',
          keyboardType: 'email-address',
          autoComplete: 'email',
          sanitize: sanitizeEmailInput,
        },
      ],
      onSave: (values) => student.updateEmail(values.email),
    },
    {
      label: 'Teléfono',
      value: profile.phone ? formatPhone(profile.phone) : displayValue(null),
      fields: [
        {
          key: 'phone',
          label: 'Teléfono',
          initial: sanitizePhoneInput(nationalPhone(profile.phone)),
          placeholder: '912345678',
          keyboardType: 'phone-pad',
          autoComplete: 'tel',
          sanitize: sanitizePhoneInput,
          prefix: <ChilePhonePrefix />,
          prefixLabel: 'Chile, código +56',
        },
      ],
      onSave: (values) => student.updatePhone(values.phone),
    },
    { label: 'Carrera', value: displayValue(profile.career) },
    { label: 'RUT', value: displayValue(profile.rut) },
  ];
}

interface ProfileRow {
  label: string;
  value: string;
  fields?: EditableField[];
  onSave?: (values: Record<string, string>) => Promise<EditResult>;
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
              {profileRows(studentProfile.profile, studentProfile).map((row, index, rows) => (
                <EditableProfileRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  fields={row.fields}
                  onSave={row.onSave}
                  divider={index < rows.length - 1}
                />
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
                    disabled={settings.readOnly}
                    trackColor={{ false: '#d9d2bd', true: '#1a2b44' }}
                    thumbColor="#ffffff"
                    accessibilityRole="switch"
                    accessibilityLabel={CONSENT_TEXT[key]}
                    accessibilityState={{ checked: settings.choices[key], disabled: settings.readOnly }}
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
                No se pudo registrar el cambio y tu permiso sigue como estaba. Revisa tu conexión e inténtalo de nuevo.
              </Text>
            ) : null}
            {settings.readOnly ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                Sin conexión con el servidor: ves el último estado guardado en este dispositivo y por ahora no puedes cambiarlo.
              </Text>
            ) : null}
            {policyFailed ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                No pudimos abrir el documento de consentimientos. Inténtalo de nuevo.
              </Text>
            ) : null}
            <Text style={styles.notice}>Cada cambio queda registrado en tu cuenta y también se guarda en este dispositivo.</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
