import { StyleSheet } from 'react-native';

/* ── Paleta cálida compartida con el dashboard ── */
const cream = '#f6f1e6';
const navy = '#1a2b44';
const yellow = '#f2c14e';
const yellowSoft = '#f9dd85';
const textSecondary = '#8a8272';
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
  container: {
    flex: 1,
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
    marginRight: 8,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: navy,
    lineHeight: 22,
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
  /* ── Tarjeta principal de check-in ── */
  checkinCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
    ...cardShadow,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardQuestion: {
    fontSize: 16,
    fontWeight: '800',
    color: navy,
    flex: 1,
    marginRight: 8,
  },
  cardHeaderDecoration: {
    marginTop: -2,
  },
  /* Selector de ánimo */
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  moodCard: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#fffdf7',
    ...cardShadow,
  },
  moodCardSelected: {
    backgroundColor: yellowSoft,
  },
  moodIcon: {
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: textSecondary,
  },
  moodLabelSelected: {
    color: navy,
    fontWeight: '800',
  },
  /* Etiquetas de emociones */
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 22,
  },
  tagPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#eee3c8',
  },
  tagPillSelected: {
    backgroundColor: yellow,
    borderColor: yellow,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: navy,
  },
  /* Campo de notas */
  notesGroup: {
    marginBottom: 18,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: navy,
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#fffdf7',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#eee3c8',
    padding: 12,
    fontSize: 12,
    color: '#3f3a2e',
    minHeight: 72,
  },
  /* Botón guardar */
  saveButton: {
    backgroundColor: navy,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  saveButtonArrow: {
    color: yellowSoft,
    fontSize: 16,
    fontWeight: 'bold',
  },
  /* ── Historial reciente ── */
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: navy,
  },
  historySubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: textSecondary,
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...cardShadow,
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  historyMoodBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyMoodBadgePositive: {
    backgroundColor: '#fff3cf',
  },
  historyMoodBadgeNeutral: {
    backgroundColor: '#ffe9dd',
  },
  historyTexts: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
    color: navy,
  },
  historyNote: {
    fontSize: 11,
    color: textSecondary,
    marginTop: 2,
  },
  historyScore: {
    fontSize: 17,
    fontWeight: '800',
    color: navy,
    marginRight: 4,
  },
});
