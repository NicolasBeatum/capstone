import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../../../shared/styles/wellness.styles';
import { AppHeader } from '../../../shared/components/AppHeader';
import { useRouter } from 'expo-router';
import { BottomNav } from '../../../shared/components/BottomNav';

export default function WellnessScreen() {
  const router = useRouter();

  const handleStartTest = () => {
    router.push('/stress-test');
  };

  const tips = [
    {
      id: 'pomodoro',
      title: 'T├®cnica Pomodoro 25/5',
      desc: 'Para d├¡as de alta carga cognitiva. Alterna trabajo concentrado con pausas sin pantallas.',
      icon: 'ÔÅ▒',
      bgColor: '#ffe4e6',
      iconColor: '#f43f5e',
    },
    {
      id: 'meditation',
      title: 'Meditaci├│n Guiada (3 min)',
      desc: 'Reduce la ansiedad pre-examen centrando tu atenci├│n en la respiraci├│n diafragm├ítica.',
      icon: '­ƒºÿ',
      bgColor: '#fbf6dc',
      iconColor: '#1a2b44',
    },
    {
      id: 'sleep',
      title: 'Higiene del Sue├▒o',
      desc: 'Evita trasnochar repasando materia. La consolidaci├│n de la memoria ocurre en el sue├▒o profundo.',
      icon: '­ƒîÖ',
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
        {/* Header con Avatar y Men├║ de Perfil */}
        <AppHeader title="Centro de Bienestar" subtitle="Herramientas y descanso" />

        {/* Tarjeta Principal de Autoevaluaci├│n Guiada */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Text style={styles.heroIconText}>­ƒôï</Text>
            </View>
            <View style={styles.heroTextGroup}>
              <Text style={styles.heroEyebrow}>AUTOEVALUACI├ôN GUIADA</Text>
              <Text style={styles.heroTitle}>Test emocional</Text>
              <Text style={styles.heroDesc}>
                Identifica tu emoci├│n del d├¡a y recibe una mirada r├ípida sobre tu estado general.
              </Text>

              <View style={styles.heroMetaRow}>
                <Text style={styles.heroMetaItem}>ÔÅ▒ 3 min</Text>
                <Text style={styles.heroMetaBullet}>ÔÇó</Text>
                <Text style={styles.heroMetaItem}>4 preguntas</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={handleStartTest}
            activeOpacity={0.85}
          >
            <Text style={styles.heroButtonText}>Comenzar Test</Text>
            <Text style={styles.heroButtonArrow}>ÔåÆ</Text>
          </TouchableOpacity>
        </View>

        {/* Secci├│n: Tips Personalizados */}
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

      {/* Navegaci├│n Inferior */}
      <BottomNav currentTab="wellness" />
    </View>
  );
}
