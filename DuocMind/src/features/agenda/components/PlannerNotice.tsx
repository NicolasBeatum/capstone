import { Text, View } from 'react-native';
import type { PlannerModel } from '@/shared/planner/application/plannerContext';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { PlannerButton } from './PlannerControls';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
export function PlannerNotice({ planner }: { planner: PlannerModel }) {
  return (
    <View style={{ gap: 10 }}>
      {planner.loading && <GotaLoader text='Cargando tu horario…' />}
      {!planner.loading && planner.snapshot && (
        <Text style={s.notice}>Esto se guarda en este dispositivo</Text>
      )}
      {planner.error && (
        <>
          <Text accessibilityRole='alert' style={s.error}>{planner.error}</Text>
          <PlannerButton label='Reintentar' secondary onPress={() => void planner.refresh()} />
        </>
      )}
    </View>
  );
}
