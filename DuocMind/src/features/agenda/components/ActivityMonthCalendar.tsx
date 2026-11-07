import { useState } from 'react';
import { Text, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import { addMonths, monthGrid, WEEKDAYS } from '@/shared/planner/domain/weeklySchedule';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
const format = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-CL', { ...options, timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );
function Arrow({ text, label, onPress }: { text: string; label: string; onPress: () => void }) {
  return (
    <ScalePress
      style={s.calendarArrow}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={label}
    >
      <Text style={s.backArrow}>{text}</Text>
    </ScalePress>
  );
}
export function ActivityMonthCalendar({ selected, today, onSelect }: {
  selected: string;
  today: string;
  onSelect: (date: string) => void;
}) {
  const [month, setMonth] = useState(selected);
  return (
    <View style={s.calendar}>
      <View style={s.calendarHeader}>
        <Arrow text='‹' label='Mes anterior' onPress={() => setMonth(addMonths(month, -1))} />
        <Text style={s.calendarTitle} accessibilityRole='header'>
          {format(month, { month: 'long', year: 'numeric' })}
        </Text>
        <Arrow text='›' label='Mes siguiente' onPress={() => setMonth(addMonths(month, 1))} />
      </View>
      <View style={s.calendarWeek}>
        {WEEKDAYS.map((weekday) => (
          <Text key={weekday} style={s.calendarWeekday}>{weekday.slice(0, 1)}</Text>
        ))}
      </View>
      {monthGrid(month).map((week, index) => (
        <View key={week.find(Boolean) ?? index} style={s.calendarWeek}>
          {week.map((day, position) =>
            day
              ? (
                <ScalePress
                  key={day}
                  style={[s.calendarDay, day === selected && s.calendarDaySelected]}
                  onPress={() => onSelect(day)}
                  accessibilityRole='button'
                  accessibilityLabel={format(day, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  aria-pressed={day === selected}
                >
                  <Text
                    style={[
                      s.calendarDayText,
                      day === today && s.calendarToday,
                      day === selected && s.calendarDayTextSelected,
                    ]}
                  >
                    {Number(day.slice(8))}
                  </Text>
                </ScalePress>
              )
              : <View key={`vacío-${position}`} style={s.calendarDay} />
          )}
        </View>
      ))}
    </View>
  );
}
