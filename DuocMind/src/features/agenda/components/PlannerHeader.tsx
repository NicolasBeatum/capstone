import { Text, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import { styles as a } from '../screens/AgendaScreen.styles';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
export function PlannerHeader({ title, subtitle, backLabel, onBack }: {
  title: string;
  subtitle?: string;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <View style={s.plannerHeader}>
      <ScalePress
        style={a.roundButton}
        onPress={onBack}
        accessibilityRole='button'
        accessibilityLabel={backLabel}
      >
        <Text style={s.backArrow}>‹</Text>
      </ScalePress>
      <View style={a.headerText}>
        <Text style={a.title} accessibilityRole='header'>{title}</Text>
        {subtitle ? <Text style={a.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}
