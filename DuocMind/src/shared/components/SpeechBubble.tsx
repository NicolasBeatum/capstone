import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SpeechBubbleProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const navy = '#1a2b44';
const fill = 'rgba(249, 221, 133, 0.35)';
const fillText = '#a08a4a';
const fillSelected = '#f9dd85';

/* Globo de diálogo para emociones: píldora pastel con colita inferior */
export function SpeechBubble({ label, selected, onPress }: SpeechBubbleProps) {
  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Emoción ${label}`}
      accessibilityState={{ selected }}
    >
      <View style={[styles.bubble, selected && styles.bubbleSelected]}>
        <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
      </View>
      <View
        style={[styles.tail, selected && styles.tailSelected]}
        pointerEvents="none"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    margin: 6,
  },
  bubble: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: fill,
  },
  bubbleSelected: {
    backgroundColor: fillSelected,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: fillText,
  },
  textSelected: {
    color: navy,
    fontWeight: '800',
  },
  tail: {
    position: 'absolute',
    bottom: -3,
    left: 24,
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: fill,
    transform: [{ rotate: '45deg' }],
  },
  tailSelected: {
    backgroundColor: fillSelected,
  },
});
