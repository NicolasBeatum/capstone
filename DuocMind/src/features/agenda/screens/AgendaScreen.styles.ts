import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/Glass';
import { fontFamily as font } from '@/shared/theme/typography';

const cream = '#f3ecda';
const navy = '#1a2b44';
const yellow = '#f2c14e';
const textSecondary = '#8a8272';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cream,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 32,
  },
  eyebrow: {
    color: textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: font.bold,
  },
  title: {
    color: navy,
    fontSize: 28,
    marginTop: 4,
    fontFamily: font.extraBold,
  },
  subtitle: {
    color: textSecondary,
    fontSize: 13,
    marginTop: 3,
    marginBottom: 22,
    fontFamily: font.regular,
  },
  weekCard: {
    padding: 15,
    marginBottom: 18,
  },
  weekTitle: {
    color: navy,
    fontSize: 14,
    marginBottom: 12,
    fontFamily: font.extraBold,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    flex: 1,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    marginHorizontal: 2,
  },
  dayButtonSelected: {
    backgroundColor: navy,
  },
  dayName: {
    color: textSecondary,
    fontSize: 9,
    fontFamily: font.bold,
  },
  dayNameSelected: {
    color: '#f9dd85',
  },
  dayNumber: {
    color: navy,
    fontSize: 18,
    marginTop: 3,
    fontFamily: font.extraBold,
  },
  dayNumberSelected: {
    color: '#ffffff',
  },
  addButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: navy,
    borderRadius: 17,
    marginBottom: 25,
    ...glassTokens.shadow,
  },
  addButtonIcon: {
    color: yellow,
    fontSize: 23,
    marginRight: 9,
    marginTop: -2,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: font.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  sectionTitle: {
    color: navy,
    fontSize: 18,
    fontFamily: font.extraBold,
  },
  count: {
    color: textSecondary,
    fontSize: 12,
    fontFamily: font.semiBold,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
    ...glassTokens.shadow,
  },
  activityTime: {
    width: 54,
    color: navy,
    fontSize: 13,
    paddingTop: 2,
    fontFamily: font.extraBold,
  },
  activityAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: yellow,
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    color: navy,
    fontSize: 14,
    fontFamily: font.extraBold,
  },
  activitySubject: {
    color: textSecondary,
    fontSize: 12,
    marginTop: 3,
    fontFamily: font.semiBold,
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: 10,
    paddingVertical: 6,
  },
  deleteText: {
    color: '#9b3d33',
    fontSize: 11,
    fontFamily: font.bold,
  },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  emptyIcon: {
    color: '#b8a66b',
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    color: navy,
    fontSize: 15,
    textAlign: 'center',
    fontFamily: font.extraBold,
  },
  emptyText: {
    color: textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    textAlign: 'center',
    fontFamily: font.regular,
  },
  statusMessage: {
    color: '#9b3d33',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: font.semiBold,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(18, 28, 43, 0.48)',
  },
  modalCard: {
    backgroundColor: cream,
    borderRadius: 24,
    padding: 22,
    ...glassTokens.shadow,
  },
  modalTitle: {
    color: navy,
    fontSize: 21,
    marginBottom: 4,
    fontFamily: font.extraBold,
  },
  modalSubtitle: {
    color: textSecondary,
    fontSize: 12,
    marginBottom: 18,
    fontFamily: font.regular,
  },
  fieldLabel: {
    color: navy,
    fontSize: 12,
    marginBottom: 6,
    fontFamily: font.bold,
  },
  input: {
    minHeight: 48,
    backgroundColor: '#ffffff',
    borderColor: 'rgba(26, 43, 68, 0.12)',
    borderRadius: 13,
    borderWidth: 1,
    color: navy,
    fontSize: 14,
    paddingHorizontal: 13,
    marginBottom: 13,
    fontFamily: font.regular,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: 'rgba(26, 43, 68, 0.08)',
  },
  cancelText: {
    color: navy,
    fontSize: 13,
    fontFamily: font.bold,
  },
  saveButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginLeft: 8,
    backgroundColor: navy,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: font.bold,
  },
});
