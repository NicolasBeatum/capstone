import { StyleSheet } from 'react-native';

/* ── Paleta cálida alineada al diseño de referencia ── */
const cream = '#f6f1e6';
const navy = '#1a2b44';
const yellow = '#f2c14e';
const yellowSoft = '#f9dd85';
const bannerYellow = '#f9e7ae';
const textSecondary = '#8a8272';
const textMuted = '#b0a891';
const cardShadow = {
  shadowColor: '#4a4230',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cream,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  /* ── Header: saludo personalizado ── */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: yellowSoft,
    fontSize: 16,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  greetingTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: navy,
  },
  greetingSubtitle: {
    fontSize: 12,
    color: textSecondary,
    marginTop: 1,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  bellIcon: {
    fontSize: 18,
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: yellow,
    borderWidth: 1.5,
    borderColor: cream,
  },
  /* ── Check-in emocional ── */
  moodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
    ...cardShadow,
  },
  moodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodCardEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: textSecondary,
    letterSpacing: 1.2,
  },
  moodCardDecoration: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moodPill: {
    width: '18%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 18,
  },
  moodPillSelected: {
    backgroundColor: yellowSoft,
  },
  moodIcon: {
    marginBottom: 6,
  },
  moodPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: textSecondary,
  },
  moodPillLabelSelected: {
    color: navy,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: navy,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  primaryButtonArrow: {
    color: yellowSoft,
    fontSize: 16,
    fontWeight: 'bold',
  },
  /* ── Secciones ── */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: navy,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
    color: textSecondary,
  },
  /* ── Medidores del día ── */
  gaugesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gaugeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    width: '48.5%',
    ...cardShadow,
  },
  gaugeText: {
    flex: 1,
    marginLeft: 10,
  },
  gaugeIcon: {
    marginBottom: 3,
    alignSelf: 'flex-start',
  },
  gaugeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: navy,
  },
  gaugeStatus: {
    fontSize: 10,
    color: textSecondary,
    marginTop: 2,
  },
  /* ── Banner de evaluación ── */
  testBanner: {
    backgroundColor: bannerYellow,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#c9a227',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  testBannerContent: {
    flex: 1,
    marginRight: 10,
  },
  testBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(26, 43, 68, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  testBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: navy,
  },
  testBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: navy,
    marginBottom: 4,
  },
  testBannerDesc: {
    fontSize: 11,
    color: '#6b6557',
    marginBottom: 12,
  },
  testBannerButton: {
    backgroundColor: navy,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  testBannerButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  testBannerButtonArrow: {
    color: yellowSoft,
    fontSize: 14,
    fontWeight: 'bold',
  },
  testBannerIllustration: {
    alignItems: 'center',
    marginLeft: 4,
    gap: 4,
  },
  /* ── Recomendación "Para ti" ── */
  recommendCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...cardShadow,
  },
  recommendIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#faf3da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendIcon: {
    fontSize: 20,
  },
  recommendText: {
    flex: 1,
    marginLeft: 12,
  },
  recommendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: navy,
  },
  recommendDesc: {
    fontSize: 11,
    color: textSecondary,
    marginTop: 2,
  },
  recommendChevron: {
    fontSize: 22,
    color: textMuted,
    marginLeft: 6,
  },
});
