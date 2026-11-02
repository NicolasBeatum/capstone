import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CloseIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { styles } from '../screens/DailyTestScreen.styles';

interface TestHeaderProps {
  /** Nombre del instrumento. */
  title: string;
  /** Línea secundaria, ej. 'Pregunta 3 de 10'. */
  detail: string;
}

/** Encabezado del test: dónde estás y cómo salir, sin más adornos. */
export function TestHeader({ title, detail }: TestHeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.headerDetail}>{detail}</Text>
      </View>
      <ScalePress
        style={styles.closeButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Cerrar test"
      >
        <CloseIcon size={16} />
      </ScalePress>
    </View>
  );
}
