import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomNav } from './_components/BottomNav';

export default function WellnessScreen() {
  const handleStartTest = () => {
    Alert.alert(
      'Test de Estrés Académico',
      'El módulo del test se encuentra en desarrollo para la siguiente iteración de evaluación.'
    );
  };

  const tips = [
    {
      id: 'pomodoro',
      title: 'Técnica Pomodoro 25/5',
      desc: 'Para días de alta carga cognitiva. Alterna trabajo concentrado con pausas sin pantallas.',
      icon: '⏱',
      bgColor: '#ffe4e6',
      iconColor: '#f43f5e',
    },
    {
      id: 'meditation',
      title: 'Meditación Guiada (3 min)',
      desc: 'Reduce la ansiedad pre-examen centrando tu atención en la respiración diafragmática.',
      icon: '🧘',
      bgColor: '#fbf6dc',
      iconColor: '#1a2b44',
    },
    {
      id: 'sleep',
      title: 'Higiene del Sueño',
      desc: 'Evita trasnochar repasando materia. La consolidación de la memoria ocurre en el sueño profundo.',
      icon: '🌙',
      bgColor: '#e0e7ff',
      iconColor: '#4338ca',
    },
  ];

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con Avatar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>CM</Text>
            </View>
            <View>
              <Text style={styles.screenTitle}>Centro de Bienestar</Text>
              <Text style={styles.screenSubtitle}>Herramientas y descanso</Text>
            </View>
          </View>
          <Text style={styles.quoteIcon}>”</Text>
        </View>

        {/* Tarjeta Principal de Autoevaluación Guiada */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Text style={styles.heroIconText}>📋</Text>
            </View>
            <View style={styles.heroTextGroup}>
              <Text style={styles.heroEyebrow}>AUTOEVALUACIÓN GUIADA</Text>
              <Text style={styles.heroTitle}>Test de Estrés Académico</Text>
              <Text style={styles.heroDesc}>
                Evalúa tu nivel actual de carga cognitiva y emocional para recibir recomendaciones
                ajustadas a tu estado.
              </Text>

              <View style={styles.heroMetaRow}>
                <Text style={styles.heroMetaItem}>⏱ 5 min</Text>
                <Text style={styles.heroMetaBullet}>•</Text>
                <Text style={styles.heroMetaItem}>10 preguntas</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={handleStartTest}
            activeOpacity={0.85}
          >
            <Text style={styles.heroButtonText}>Comenzar Test</Text>
            <Text style={styles.heroButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Sección: Tips Personalizados */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsHeader}>
            <Text style={styles.tipsTitle}>Tips Personalizados</Text>
            <Text style={styles.tipsBadge}>Basado en tu estado</Text>
          </View>

          <View style={styles.tipsList}>
            {tips.map((tip) => (
              <View key={tip.id} style={styles.tipCard}>
                <View style={[styles.tipIconBox, { backgroundColor: tip.bgColor }]}>
                  <Text style={styles.tipIconText}>{tip.icon}</Text>
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDesc}>{tip.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Navegación Inferior */}
      <BottomNav currentTab="wellness" />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f7',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a2b44',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f3e7a0',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#f3e7a0',
    fontSize: 14,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2b44',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  quoteIcon: {
    fontSize: 28,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#1a2b44',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#fbf6dc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroIconText: {
    fontSize: 20,
  },
  heroTextGroup: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: '#d4b43c',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2b44',
    marginTop: 2,
  },
  heroDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  heroMetaItem: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  heroMetaBullet: {
    fontSize: 10,
    color: '#cbd5e1',
    marginHorizontal: 6,
  },
  heroButton: {
    backgroundColor: '#1a2b44',
    borderRadius: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  heroButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  heroButtonArrow: {
    color: '#ffffff',
    fontSize: 14,
  },
  tipsSection: {
    marginBottom: 10,
  },
  tipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2b44',
  },
  tipsBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d4b43c',
  },
  tipsList: {
    gap: 10,
  },
  tipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tipIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipIconText: {
    fontSize: 18,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2b44',
  },
  tipDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
});

