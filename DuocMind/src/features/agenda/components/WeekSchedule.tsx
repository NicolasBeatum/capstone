import { Text, View } from 'react-native';
import { Reveal } from '@/shared/motion/Reveal';
import { ScalePress } from '@/shared/components/ScalePress';
import { type WeekDayClasses, WEEKDAYS } from '@/shared/planner/domain/weeklySchedule';
import { AgendaTimelineRow } from './AgendaTimelineRow';
import { styles as a } from '../screens/AgendaScreen.styles';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
export function WeekSchedule({ week, today, onOpen }: {
  week: WeekDayClasses[];
  today: number;
  onOpen: (subjectId: string, blockId: string) => void;
}) {
  return week.map(({ weekday, classes }, index) => (
    <Reveal key={weekday} index={index}>
      <View style={s.weekDay}>
        <View style={s.weekDayHeader}>
          <Text style={s.weekDayTitle} accessibilityRole='header'>{WEEKDAYS[weekday - 1]}</Text>
          {weekday === today && <Text style={s.pill}>Hoy</Text>}
          <Text style={a.dayCount}>
            {classes.length} {classes.length === 1 ? 'clase' : 'clases'}
          </Text>
        </View>
        <View>
          {classes.map(({ block, subject }, position) => (
            <AgendaTimelineRow
              key={block.id}
              start={block.startsAt}
              end={block.endsAt}
              dotColor='#6b5aa8'
              isLast={position === classes.length - 1}
            >
              <ScalePress
                style={s.card}
                onPress={() => onOpen(subject.id, block.id)}
                accessibilityRole='button'
                accessibilityLabel={`Editar clase ${subject.name}, ${
                  WEEKDAYS[weekday - 1]
                } ${block.startsAt}–${block.endsAt}`}
              >
                <Text style={s.cardTitle}>{subject.name}</Text>
                {(block.room || block.teacher) && (
                  <Text style={s.subtitle}>
                    {[block.room, block.teacher].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </ScalePress>
            </AgendaTimelineRow>
          ))}
        </View>
      </View>
    </Reveal>
  ));
}
