import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/shared/components/AppHeader';
import { BottomNav } from '@/shared/components/BottomNav';
import { GlassCard, LiquidBackground } from '@/shared/components/Glass';
import { CheckSquareIcon } from '@/shared/components/Icons';
import { fontFamily as font } from '@/shared/theme/typography';

/* Vista provisoria para que la pestaña Pendientes tenga destino mientras se diseña. */
export default function PendingScreen() {
  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppHeader title="Pendientes" subtitle="Tus tareas por hacer" />
        <GlassCard style={styles.card}>
          <CheckSquareIcon size={40} />
          <Text style={styles.title}>Muy pronto</Text>
          <Text style={styles.desc}>Aquí verás tus pendientes académicos y de bienestar.</Text>
        </GlassCard>
      </ScrollView>
      <BottomNav currentTab="pending" />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3ecda',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 28,
  },
  card: {
    alignItems: 'center',
    padding: 28,
    marginTop: 12,
  },
  title: {
    fontSize: 18,
    color: '#1a2b44',
    marginTop: 12,
    fontFamily: font.bold,
  },
  desc: {
    fontSize: 14,
    color: '#475569',
    marginTop: 6,
    textAlign: 'center',
  },
});
