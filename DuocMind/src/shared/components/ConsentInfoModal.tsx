import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { glassTokens } from "@/shared/components/Glass";
import { ScalePress } from "@/shared/components/ScalePress";
import {
  CONSENT_DETAILS,
  CONSENT_UPLOAD_NOTE,
  type ConsentKey,
} from "@/shared/consents/domain/consents";
import { fontFamily as font } from "@/shared/theme/typography";
import { warmPalette } from "@/shared/theme/warmPalette";

interface ConsentInfoModalProps {
  /** Consentimiento que se explica; null mantiene el modal cerrado. */
  consent: ConsentKey | null;
  onClose: () => void;
  /** Abre el documento completo; si falta, no se muestra el enlace. */
  onOpenDocument?: () => void;
}

/* backdropFilter solo existe en web; en Android el vidrio se simula con la superficie translúcida */
const webBlur = (amount: number): ViewStyle =>
  Platform.OS === "web"
    ? ({ backdropFilter: `blur(${amount}px)` } as ViewStyle)
    : {};

/** Explica en pocas líneas qué comparte un consentimiento, quién lo ve y qué pasa al desactivarlo. */
export function ConsentInfoModal({
  consent,
  onClose,
  onOpenDocument,
}: ConsentInfoModalProps) {
  // Se conserva el último contenido para que no desaparezca mientras el modal se desvanece.
  const lastConsent = React.useRef<ConsentKey>("shareAnonymousData");
  if (consent) lastConsent.current = consent;
  const detail = CONSENT_DETAILS[lastConsent.current];

  return (
    <Modal
      visible={consent !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, webBlur(10)]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar explicación"
      />
      <View style={styles.center} pointerEvents="box-none">
        <View style={[styles.card, webBlur(24)]} accessibilityViewIsModal>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title} accessibilityRole="header">
              {detail.title}
            </Text>
            <Text style={styles.summary}>{detail.summary}</Text>

            {detail.sections.map((section) => (
              <View key={section.heading} style={styles.section}>
                <Text style={styles.heading}>{section.heading}</Text>
                {section.items.map((item) => (
                  <View key={item} style={styles.item}>
                    <Text
                      style={styles.bullet}
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    >
                      •
                    </Text>
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}

            <Text style={styles.note}>{CONSENT_UPLOAD_NOTE}</Text>
          </ScrollView>

          <ScalePress
            style={styles.primaryButton}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Entendido</Text>
          </ScalePress>
          {onOpenDocument ? (
            <ScalePress
              style={styles.secondaryButton}
              onPress={onOpenDocument}
              accessibilityRole="link"
              accessibilityLabel="Leer el documento completo de consentimientos"
            >
              <Text style={styles.secondaryButtonText}>
                Leer el documento completo
              </Text>
            </ScalePress>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(26, 43, 68, 0.28)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "100%",
    overflow: "hidden",
    backgroundColor:
      Platform.OS === "web"
        ? "rgba(255, 253, 247, 0.9)"
        : "rgba(255, 253, 247, 0.98)",
    borderWidth: 1,
    borderColor: glassTokens.border,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 12,
    ...glassTokens.shadow,
  },
  content: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    color: warmPalette.navy,
    fontFamily: font.extraBold,
    marginBottom: 6,
  },
  summary: {
    fontSize: 14,
    lineHeight: 21,
    color: warmPalette.textSecondary,
    fontFamily: font.regular,
    marginBottom: 6,
  },
  section: {
    marginTop: 12,
  },
  heading: {
    fontSize: 13,
    lineHeight: 18,
    color: warmPalette.navy,
    fontFamily: font.bold,
    marginBottom: 4,
  },
  item: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: warmPalette.goldText,
    fontFamily: font.bold,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: warmPalette.navy,
    fontFamily: font.regular,
  },
  note: {
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: warmPalette.goldSoft,
    fontSize: 13,
    lineHeight: 19,
    color: warmPalette.navy,
    fontFamily: font.semiBold,
  },
  primaryButton: {
    alignSelf: "stretch",
    height: 50,
    borderRadius: 25,
    backgroundColor: warmPalette.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: warmPalette.white,
    fontSize: 15,
    fontFamily: font.extraBold,
  },
  secondaryButton: {
    alignSelf: "stretch",
    minHeight: 44,
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: warmPalette.navy,
    fontSize: 14,
    textDecorationLine: "underline",
    fontFamily: font.bold,
  },
});
