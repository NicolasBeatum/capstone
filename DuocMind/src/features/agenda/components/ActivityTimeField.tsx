import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import { changeTimePart } from '@/shared/planner/domain/personalActivityTime';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
function ClockInput({ label, value, onValid }: {
  label: string;
  value: string;
  onValid: (text: string) => void;
}) {
  // El borrador permite escribir valores parciales; al salir se muestra el último válido.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <TextInput
      accessibilityLabel={label}
      style={s.clockInput}
      value={draft ?? value}
      keyboardType='number-pad'
      maxLength={2}
      selectTextOnFocus
      onChangeText={(text) => {
        const digits = text.replace(/\D/g, '');
        setDraft(digits);
        if (digits) onValid(digits);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
export function ActivityTimeRow({ title, label, value, onChange }: {
  title: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const update = (part: 'hour' | 'minute', text: string) => {
    const time = changeTimePart(value, part, text);
    if (time) onChange(time);
  };
  return (
    <View style={s.timeRow}>
      <Text style={s.timeRowTitle}>{title}</Text>
      <ClockInput
        label={`${label}, hora`}
        value={value.slice(0, 2)}
        onValid={(hour) => update('hour', hour)}
      />
      <Text style={s.clockColon}>:</Text>
      <ClockInput
        label={`${label}, minutos`}
        value={value.slice(3, 5)}
        onValid={(minute) => update('minute', minute)}
      />
    </View>
  );
}
